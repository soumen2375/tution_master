import { supabase } from '@/lib/supabase';
import type { Note } from '@/lib/types';

/** Get all notes for a batch */
export async function getBatchNotes(batchId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Note[];
}

/** Get all notes for a student's enrolled batches */
export async function getStudentNotes() {
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
    .from('notes')
    .select('*, batch:batches(name, subject)')
    .in('batch_id', enrolledBatchIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as (Note & { batch: { name: string; subject: string } })[];
}

export interface UploadNoteInput {
  batch_id: string;
  title: string;
  description?: string;
  is_public?: boolean;
  file: File;
}

/** Upload a note file to Supabase Storage and create a record */
export async function uploadNote(input: UploadNoteInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!teacher) throw new Error('Teacher profile not found');

  // Upload file
  const ext = input.file.name.split('.').pop();
  const path = `${teacher.id}/${input.batch_id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('notes')
    .upload(path, input.file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('notes')
    .getPublicUrl(path);

  // Insert note record
  const { data, error } = await supabase
    .from('notes')
    .insert({
      batch_id: input.batch_id,
      title: input.title,
      description: input.description ?? null,
      file_url: publicUrl,
      file_type: ext ?? 'unknown',
      file_size_kb: Math.round(input.file.size / 1024),
      is_public: input.is_public ?? false,
      uploaded_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

/** Increment download count */
export async function incrementNoteDownload(noteId: string) {
  await supabase.rpc('increment_note_downloads', { note_id: noteId });
}

/** Delete a note and its storage file */
export async function deleteNote(noteId: string) {
  const { data: note } = await supabase
    .from('notes')
    .select('file_url')
    .eq('id', noteId)
    .single();

  if (note?.file_url) {
    const path = new URL(note.file_url).pathname.split('/notes/')[1];
    await supabase.storage.from('notes').remove([path]);
  }

  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw error;
}
