import { supabase } from '@/lib/supabase';
import type { Batch, ScheduleSlot, BatchStatus } from '@/lib/types';

/** Get all batches for the logged-in teacher */
export async function getTeacherBatches() {
  const { data, error } = await supabase
    .from('batches')
    .select(`
      *,
      enrollments(count)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as (Batch & { enrollments: { count: number }[] })[];
}

/** Get a single batch by ID */
export async function getBatchById(batchId: string) {
  const { data, error } = await supabase
    .from('batches')
    .select(`*, teacher:teacher_profiles(*, profile:profiles(*))`)
    .eq('id', batchId)
    .single();
  if (error) throw error;
  return data as Batch;
}

/** Find batch by invite code (public, used for join flow) */
export async function getBatchByInviteCode(code: string) {
  const { data, error } = await supabase
    .from('batches')
    .select(`*, teacher:teacher_profiles(*, profile:profiles(full_name))`)
    .eq('invite_code', code.toUpperCase())
    .single();
  if (error) throw error;
  return data as Batch;
}

export interface CreateBatchInput {
  name: string;
  subject: string;
  description?: string;
  type: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  schedule: ScheduleSlot[];
  start_date: string;
  end_date?: string;
  max_students: number;
  monthly_fee: number;
  meeting_link?: string;
  is_public?: boolean;
}

/** Create a new batch */
export async function createBatch(input: CreateBatchInput) {
  // Get teacher profile id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: teacher, error: tError } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (tError) throw tError;

  // Generate unique invite code
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('batches')
    .insert({ ...input, teacher_id: teacher.id, invite_code })
    .select()
    .single();
  if (error) throw error;
  return data as Batch;
}

/** Update a batch */
export async function updateBatch(batchId: string, updates: Partial<CreateBatchInput>) {
  const { data, error } = await supabase
    .from('batches')
    .update(updates)
    .eq('id', batchId)
    .select()
    .single();
  if (error) throw error;
  return data as Batch;
}

/** Archive (soft delete) a batch */
export async function archiveBatch(batchId: string) {
  const { error } = await supabase
    .from('batches')
    .update({ status: 'COMPLETED' as BatchStatus })
    .eq('id', batchId);
  if (error) throw error;
}

/** Get batch stats for overview tab */
export async function getBatchStats(batchId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [enrollCount, sessionCount, feeData] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact' })
      .eq('batch_id', batchId).eq('status', 'ACTIVE'),
    supabase.from('sessions').select('id', { count: 'exact' })
      .eq('batch_id', batchId).eq('is_cancelled', false),
    supabase.from('fee_payments').select('status')
      .eq('batch_id', batchId).eq('month', month).eq('year', year),
  ]);

  const totalFees = feeData.data?.length ?? 0;
  const paidFees = feeData.data?.filter(f => f.status === 'PAID').length ?? 0;

  return {
    activeStudents: enrollCount.count ?? 0,
    totalSessions: sessionCount.count ?? 0,
    feeCollectionRate: totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0,
  };
}
