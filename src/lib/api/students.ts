import { supabase } from '@/lib/supabase';
import type { Enrollment } from '@/lib/types';

/** Get all active enrollments for a batch (teacher view) */
export async function getBatchEnrollments(batchId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:student_profiles(
        *,
        profile:profiles(full_name, phone, avatar_url)
      )
    `)
    .eq('batch_id', batchId)
    .order('enrolled_at', { ascending: true });
  if (error) throw error;
  return data as Enrollment[];
}

/** Get all batches a student is enrolled in */
export async function getStudentEnrollments() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!student) throw new Error('Student profile not found');

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      batch:batches(
        *,
        teacher:teacher_profiles(*, profile:profiles(full_name))
      )
    `)
    .eq('student_id', student.id)
    .eq('status', 'ACTIVE');
  if (error) throw error;
  return data as Enrollment[];
}

/** Enroll a student in a batch via invite code */
export async function joinBatch(inviteCode: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!student) throw new Error('Student profile not found');

  const { data: batch, error: bError } = await supabase
    .from('batches')
    .select('id, max_students, enrollments(count)')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();
  if (bError) throw new Error('Batch not found. Check the invite code.');

  const currentCount = (batch.enrollments as { count: number }[])[0]?.count ?? 0;
  if (currentCount >= batch.max_students) throw new Error('This batch is full.');

  const { data, error } = await supabase
    .from('enrollments')
    .insert({ student_id: student.id, batch_id: batch.id })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('You are already enrolled in this batch.');
    throw error;
  }
  return data as Enrollment;
}

/** Remove / drop a student from a batch */
export async function dropStudent(enrollmentId: string) {
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'DROPPED', dropped_at: new Date().toISOString() })
    .eq('id', enrollmentId);
  if (error) throw error;
}

/** Get all students across all teacher's batches */
export async function getAllTeacherStudents() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!teacher) throw new Error('Teacher profile not found');

  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:student_profiles(
        *,
        profile:profiles(full_name, phone, avatar_url)
      ),
      batch:batches(id, name, subject)
    `)
    .in('batch_id', (
      await supabase.from('batches').select('id').eq('teacher_id', teacher.id)
    ).data?.map(b => b.id) ?? [])
    .eq('status', 'ACTIVE');
  if (error) throw error;
  return data as Enrollment[];
}
