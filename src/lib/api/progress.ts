import { supabase } from '@/lib/supabase';
import type { ProgressRecord } from '@/lib/types';

/** Get progress records for a student (all months) */
export async function getStudentProgress(studentId?: string) {
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
    .from('progress_records')
    .select('*')
    .eq('student_id', sid!)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw error;
  return data as ProgressRecord[];
}

/** Upsert a progress record (teacher adds exam score / rating) */
export async function upsertProgressRecord(input: {
  student_id: string;
  batch_id: string;
  month: number;
  year: number;
  exam_score?: number;
  exam_total?: number;
  performance_note?: string;
  teacher_rating?: number;
}) {
  const { data, error } = await supabase
    .from('progress_records')
    .upsert(input, { onConflict: 'student_id,batch_id,month,year' })
    .select()
    .single();
  if (error) throw error;
  return data as ProgressRecord;
}

/** Auto-calculate and update attendance stats in progress_records */
export async function recalculateAttendanceProgress(studentId: string, batchId: string, month: number, year: number) {
  // Get all sessions in this batch/month
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('batch_id', batchId)
    .eq('is_cancelled', false)
    .gte('date', start)
    .lte('date', end);

  const sessionIds = sessions?.map(s => s.id) ?? [];
  const totalSessions = sessionIds.length;

  if (totalSessions === 0) return;

  const { data: att } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', studentId)
    .in('session_id', sessionIds);

  const present = att?.filter(a => a.status === 'PRESENT').length ?? 0;
  const late = att?.filter(a => a.status === 'LATE').length ?? 0;
  const attendance_pct = ((present + late * 0.5) / totalSessions) * 100;

  await supabase.from('progress_records').upsert({
    student_id: studentId,
    batch_id: batchId,
    month,
    year,
    total_sessions: totalSessions,
    present_count: present,
    late_count: late,
    attendance_pct: Math.round(attendance_pct * 10) / 10,
  }, { onConflict: 'student_id,batch_id,month,year' });
}
