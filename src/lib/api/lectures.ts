import { supabase } from '@/lib/supabase';
import type { VideoLecture } from '@/lib/types';

/** Get all lectures for a batch */
export async function getBatchLectures(batchId: string) {
  const { data, error } = await supabase
    .from('video_lectures')
    .select('*')
    .eq('batch_id', batchId)
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as VideoLecture[];
}

/** Get all lectures for a student's enrolled batches */
export async function getStudentLectures() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: student } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!student) throw new Error('Student profile not found');

  const enrolledBatchIds = (
    await supabase.from('enrollments')
      .select('batch_id')
      .eq('student_id', student.id)
      .eq('status', 'ACTIVE')
  ).data?.map(e => e.batch_id) ?? [];

  const { data, error } = await supabase
    .from('video_lectures')
    .select('*, batch:batches(name, subject)')
    .in('batch_id', enrolledBatchIds)
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as (VideoLecture & { batch: { name: string; subject: string } })[];
}

export interface AddLectureInput {
  batch_id: string;
  title: string;
  description?: string;
  video_url: string;
  topic?: string;
  status?: 'PUBLISHED' | 'DRAFT';
}

/** Extract YouTube thumbnail from URL */
export function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  return null;
}

/** Convert YouTube URL to embed URL */
export function toYoutubeEmbed(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

/** Add a video lecture (YouTube URL only for now) */
export async function addLecture(input: AddLectureInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const thumbnail_url = getYoutubeThumbnail(input.video_url);

  const { data, error } = await supabase
    .from('video_lectures')
    .insert({
      batch_id: input.batch_id,
      title: input.title,
      description: input.description ?? null,
      video_url: input.video_url,
      thumbnail_url,
      topic: input.topic ?? null,
      status: input.status ?? 'PUBLISHED',
      uploaded_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as VideoLecture;
}

/** Increment view count */
export async function incrementLectureView(lectureId: string) {
  await supabase.rpc('increment_lecture_views', { lecture_id: lectureId });
}

/** Delete a lecture */
export async function deleteLecture(lectureId: string) {
  const { error } = await supabase
    .from('video_lectures')
    .delete()
    .eq('id', lectureId);
  if (error) throw error;
}
