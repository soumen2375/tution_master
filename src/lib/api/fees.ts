import { supabase } from '@/lib/supabase';
import type { FeePayment, FeeStatus, PaymentMethod } from '@/lib/types';

/** Get all fee payments for a batch (month×student grid) */
export async function getBatchFees(batchId: string, month?: number, year?: number) {
  let query = supabase
    .from('fee_payments')
    .select(`
      *,
      student:student_profiles(
        *,
        profile:profiles(full_name, avatar_url)
      )
    `)
    .eq('batch_id', batchId);

  if (month) query = query.eq('month', month);
  if (year) query = query.eq('year', year);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as FeePayment[];
}

/** Get all fee payments for a student */
export async function getStudentFees(studentId?: string) {
  let sid = studentId;
  if (!sid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    sid = sp?.id;
  }

  const { data, error } = await supabase
    .from('fee_payments')
    .select(`*, batch:batches(name, subject)`)
    .eq('student_id', sid!)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw error;
  return data as FeePayment[];
}

/** Teacher fee overview — current month stats */
export async function getTeacherFeeStats(teacherId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const batchIds = (
    await supabase.from('batches').select('id').eq('teacher_id', teacherId)
  ).data?.map(b => b.id) ?? [];

  const { data } = await supabase
    .from('fee_payments')
    .select('amount, status')
    .in('batch_id', batchIds)
    .eq('month', month)
    .eq('year', year);

  const all = data ?? [];
  const expected = all.reduce((s, f) => s + Number(f.amount), 0);
  const collected = all.filter(f => f.status === 'PAID').reduce((s, f) => s + Number(f.amount), 0);
  const pending = all.filter(f => ['PENDING', 'PARTIAL'].includes(f.status)).reduce((s, f) => s + Number(f.amount), 0);
  const overdue = all.filter(f => f.status === 'OVERDUE').length;

  return { expected, collected, pending, overdue, month, year };
}

export interface RecordPaymentInput {
  student_id: string;
  batch_id: string;
  month: number;
  year: number;
  amount: number;
  payment_method?: PaymentMethod;
  remark?: string;
  due_date?: string;
}

/** Record or update a fee payment */
export async function recordPayment(input: RecordPaymentInput) {
  const { data: { user } } = await supabase.auth.getUser();

  // Generate receipt number
  const receipt_number = `RCT-${Date.now().toString(36).toUpperCase()}`;
  const due_date = input.due_date ?? `${input.year}-${String(input.month).padStart(2, '0')}-10`;

  const { data, error } = await supabase
    .from('fee_payments')
    .upsert({
      student_id: input.student_id,
      batch_id: input.batch_id,
      month: input.month,
      year: input.year,
      amount: input.amount,
      status: 'PAID' as FeeStatus,
      payment_method: input.payment_method ?? null,
      paid_at: new Date().toISOString(),
      due_date,
      receipt_number,
      remark: input.remark ?? null,
      recorded_by: user?.id ?? null,
    }, { onConflict: 'student_id,batch_id,month,year' })
    .select()
    .single();
  if (error) throw error;
  return data as FeePayment;
}

/** Bulk generate pending fee records for all active students in a batch */
export async function generateMonthlyFees(batchId: string, month: number, year: number) {
  // Get batch monthly fee
  const { data: batch } = await supabase
    .from('batches')
    .select('monthly_fee')
    .eq('id', batchId)
    .single();
  if (!batch) throw new Error('Batch not found');

  // Get all active students
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('batch_id', batchId)
    .eq('status', 'ACTIVE');
  if (!enrollments?.length) return [];

  const due_date = `${year}-${String(month).padStart(2, '0')}-10`;
  const records = enrollments.map(e => ({
    student_id: e.student_id,
    batch_id: batchId,
    month,
    year,
    amount: batch.monthly_fee,
    status: 'PENDING' as FeeStatus,
    due_date,
  }));

  const { data, error } = await supabase
    .from('fee_payments')
    .upsert(records, { onConflict: 'student_id,batch_id,month,year', ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return data as FeePayment[];
}

/** Mark overdue: update all PENDING past due_date to OVERDUE */
export async function markOverdueFees() {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('fee_payments')
    .update({ status: 'OVERDUE' as FeeStatus })
    .in('status', ['PENDING'])
    .lt('due_date', today);
  if (error) throw error;
}
