import { supabase } from '@/lib/supabase';
import type { Session, Attendance, AttendanceStatus } from '@/lib/types';

/** Get all sessions for a batch */
export async function getBatchSessions(batchId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('batch_id', batchId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Session[];
}

/** Get a single session with all attendance records */
export async function getSessionWithAttendance(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      attendances:attendance(
        *,
        student:student_profiles(
          *,
          profile:profiles(full_name, avatar_url)
        )
      )
    `)
    .eq('id', sessionId)
    .single();
  if (error) throw error;
  return data as Session;
}

/** Get attendance for a specific student in a batch (monthly) */
export async function getStudentAttendance(studentId: string, batchId: string, month?: number, year?: number) {
  let query = supabase
    .from('attendance')
    .select(`*, session:sessions(*)`)
    .eq('student_id', studentId);

  // Filter sessions by batch + month if provided
  if (batchId) {
    const sessionIds = (
      await supabase.from('sessions')
        .select('id')
        .eq('batch_id', batchId)
    ).data?.map(s => s.id) ?? [];
    query = query.in('session_id', sessionIds);
  }

  const { data, error } = await query.order('session_id');
  if (error) throw error;

  type AttendanceWithSession = Attendance & { session: { date: string; batch_id: string } };
  const typed = (data as unknown) as AttendanceWithSession[];

  if (month && year) {
    return typed.filter(a => {
      const d = new Date(a.session.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }
  return typed;
}

/** Create a new class session */
export async function createSession(input: {
  batch_id: string;
  date: string;
  start_time: string;
  end_time: string;
  title?: string;
  topic?: string;
}) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

/** Get or create a session for a given date+batch */
export async function getOrCreateSession(batchId: string, date: string, startTime: string, endTime: string) {
  const { data: existing } = await supabase
    .from('sessions')
    .select('*')
    .eq('batch_id', batchId)
    .eq('date', date)
    .maybeSingle();

  if (existing) return existing as Session;
  return createSession({ batch_id: batchId, date, start_time: startTime, end_time: endTime });
}

/** Bulk mark attendance for a session */
export async function markAttendance(
  sessionId: string,
  records: { student_id: string; status: AttendanceStatus; remark?: string }[]
) {
  const payload = records.map(r => ({
    session_id: sessionId,
    student_id: r.student_id,
    status: r.status,
    remark: r.remark ?? null,
    marked_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('attendance')
    .upsert(payload, { onConflict: 'student_id,session_id' })
    .select();
  if (error) throw error;
  return data as Attendance[];
}

/** Update a single attendance record */
export async function updateAttendance(id: string, status: AttendanceStatus, remark?: string) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status, remark: remark ?? null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Attendance;
}

/** Get monthly attendance summary for a student */
export async function getStudentMonthlyAttendanceSummary(studentId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('status, session:sessions(date, batch_id)')
    .eq('student_id', studentId);
  if (error) throw error;
  return (data as unknown) as (Attendance & { session: { date: string; batch_id: string } })[];
}
