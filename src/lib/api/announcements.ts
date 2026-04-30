import { supabase } from '@/lib/supabase';
import type { Announcement, AnnouncementScope } from '@/lib/types';

/** Get all announcements for a teacher */
export async function getTeacherAnnouncements() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!teacher) throw new Error('Teacher profile not found');

  const { data, error } = await supabase
    .from('announcements')
    .select('*, batch:batches(name, subject)')
    .eq('teacher_id', teacher.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

/** Get announcements for a specific batch */
export async function getBatchAnnouncements(batchId: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('batch_id', batchId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

/** Get all announcements visible to a student */
export async function getStudentAnnouncements() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!student) throw new Error('Student profile not found');

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('batch_id')
    .eq('student_id', student.id)
    .eq('status', 'ACTIVE');

  const batchIds = enrollments?.map(e => e.batch_id) ?? [];

  const { data, error } = await supabase
    .from('announcements')
    .select('*, batch:batches(name, subject)')
    .or(`batch_id.in.(${batchIds.join(',')}),scope.eq.ALL`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  scope: AnnouncementScope;
  batch_id?: string;
  is_pinned?: boolean;
}

/** Create an announcement */
export async function createAnnouncement(input: CreateAnnouncementInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!teacher) throw new Error('Teacher profile not found');

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      teacher_id: teacher.id,
      batch_id: input.batch_id ?? null,
      title: input.title,
      body: input.body,
      scope: input.scope,
      is_pinned: input.is_pinned ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Announcement;
}

/** Toggle pin */
export async function togglePin(announcementId: string, isPinned: boolean) {
  const { error } = await supabase
    .from('announcements')
    .update({ is_pinned: isPinned })
    .eq('id', announcementId);
  if (error) throw error;
}

/** Delete an announcement */
export async function deleteAnnouncement(announcementId: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId);
  if (error) throw error;
}
