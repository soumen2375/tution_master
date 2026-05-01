import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays, faPlus, faTrash, faChevronLeft, faChevronRight,
  faCheckCircle, faCircleXmark, faFilter, faClock,
  faChalkboard, faUsers,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Session {
  id: string;
  batch_id: string;
  batch_name: string;
  session_date: string;
  topic: string | null;
  total: number;
  present: number;
}

interface Batch { id: string; name: string; }

interface Student {
  student_profile_id: string;
  full_name: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

const sessionSchema = z.object({
  batch_id: z.string().min(1, 'Select a batch'),
  session_date: z.string().min(1, 'Select a date'),
  topic: z.string().optional(),
});
type SessionForm = z.infer<typeof sessionSchema>;

export default function AttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [markModal, setMarkModal] = useState<Session | null>(null);
  const [deleteModal, setDeleteModal] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionStudents, setSessionStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);

  const PAGE_SIZE = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { session_date: format(new Date(), 'yyyy-MM-dd') },
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tp } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single();
    if (!tp) return;

    const { data: batchData } = await supabase.from('batches').select('id,name').eq('teacher_id', tp.id).eq('status', 'ACTIVE');
    setBatches(batchData || []);
    const batchIds = (batchData || []).map(b => b.id);
    if (!batchIds.length) { setLoading(false); return; }

    const batchMap = new Map((batchData || []).map(b => [b.id, b.name]));

    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, batch_id, date, topic')
      .in('batch_id', batchIds)
      .order('date', { ascending: false });

    if (!sessData?.length) { setSessions([]); setLoading(false); return; }

    const sessionIds = sessData.map(s => s.id);
    const { data: attData } = await supabase
      .from('attendance')
      .select('session_id, status')
      .in('session_id', sessionIds);

    const attMap = new Map<string, { total: number; present: number }>();
    sessData.forEach(s => attMap.set(s.id, { total: 0, present: 0 }));
    (attData || []).forEach((a: any) => {
      const entry = attMap.get(a.session_id);
      if (entry) {
        entry.total++;
        if (a.status === 'PRESENT' || a.status === 'LATE') entry.present++;
      }
    });

    setSessions(sessData.map(s => ({
      id: s.id,
      batch_id: s.batch_id,
      batch_name: batchMap.get(s.batch_id) || '',
      session_date: s.date,
      topic: s.topic,
      total: attMap.get(s.id)?.total || 0,
      present: attMap.get(s.id)?.present || 0,
    })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!batchFilter) return sessions;
    return sessions.filter(s => s.batch_id === batchFilter);
  }, [sessions, batchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function onAddSession(data: SessionForm) {
    setSaving(true);
    try {
      const { error } = await supabase.from('sessions').insert({
        batch_id: data.batch_id,
        date: data.session_date,
        start_time: '00:00',
        end_time: '00:00',
        topic: data.topic || null,
      });
      if (error) throw error;
      toast.success('Session created');
      setAddModal(false);
      reset({ session_date: format(new Date(), 'yyyy-MM-dd') });
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function openMarkModal(session: Session) {
    setMarkModal(session);
    const [enrollRes, attRes] = await Promise.all([
      supabase.from('enrollments')
        .select('student:student_profiles(id, profile:profiles(full_name))')
        .eq('batch_id', session.batch_id)
        .eq('status', 'ACTIVE'),
      supabase.from('attendance')
        .select('student_id, status')
        .eq('session_id', session.id),
    ]);
    const studs: Student[] = (enrollRes.data || []).map((e: any) => ({
      student_profile_id: e.student?.id || '',
      full_name: e.student?.profile?.full_name || 'Unknown',
    }));
    setSessionStudents(studs);
    const existing = (attRes.data || []) as AttendanceRecord[];
    setExistingAttendance(existing);
    const map: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    studs.forEach(s => { map[s.student_profile_id] = 'PRESENT'; });
    existing.forEach(a => { map[a.student_id] = a.status; });
    setAttendance(map);
  }

  async function saveAttendance() {
    if (!markModal) return;
    setSaving(true);
    try {
      const existingIds = new Set(existingAttendance.map(a => a.student_id));
      const toInsert = sessionStudents
        .filter(s => !existingIds.has(s.student_profile_id))
        .map(s => ({ session_id: markModal.id, student_id: s.student_profile_id, status: attendance[s.student_profile_id] || 'ABSENT' }));
      const toUpdate = existingAttendance.map(a => ({
        session_id: markModal.id, student_id: a.student_id, status: attendance[a.student_id] || 'ABSENT',
      }));
      const ops = [];
      if (toInsert.length) ops.push(supabase.from('attendance').insert(toInsert));
      for (const rec of toUpdate) {
        ops.push(supabase.from('attendance').update({ status: rec.status }).eq('session_id', markModal.id).eq('student_id', rec.student_id));
      }
      await Promise.all(ops);
      toast.success('Attendance saved');
      setMarkModal(null);
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await supabase.from('attendance').delete().eq('session_id', deleteModal.id);
      const { error } = await supabase.from('sessions').delete().eq('id', deleteModal.id);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== deleteModal.id));
      toast.success('Session deleted');
      setDeleteModal(null);
    } catch (e: any) { toast.error(e.message); }
  }

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    const next: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    sessionStudents.forEach(s => { next[s.student_profile_id] = status; });
    setAttendance(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Attendance</h2>
          <p className="text-sm text-slate-500 mt-0.5">{sessions.length} sessions recorded</p>
        </div>
        <button onClick={() => { reset({ session_date: format(new Date(), 'yyyy-MM-dd') }); setAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus} /> New Session
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <table className="data-table"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={faCalendarDays} title="No Sessions Yet"
            description={batchFilter ? 'No sessions for this batch.' : 'Create a session to start taking attendance.'}
            action={!batchFilter ? { label: '+ New Session', onClick: () => setAddModal(true) } : undefined} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch</th>
                    <th>Topic</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(s => {
                    const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : null;
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                              <FontAwesomeIcon icon={faCalendarDays} className="text-xs" />
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {format(new Date(s.session_date), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <FontAwesomeIcon icon={faChalkboard} className="text-slate-400 text-xs" />
                            {s.batch_name}
                          </div>
                        </td>
                        <td><span className="text-sm text-slate-500">{s.topic || '—'}</span></td>
                        <td>
                          {s.total === 0 ? (
                            <span className="text-xs text-slate-400 italic">Not marked</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                {s.present}/{s.total}
                              </span>
                              {pct !== null && (
                                <span className={`text-xs font-semibold ${pct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  ({pct}%)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openMarkModal(s)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer">
                              <FontAwesomeIcon icon={faCheckCircle} /> Mark
                            </button>
                            <button onClick={() => setDeleteModal(s)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Session Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Attendance Session" size="sm"
        footer={<>
          <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onAddSession)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Session'}
          </button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Batch *</label>
            <select {...register('batch_id')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.batch_id && <p className="text-xs text-red-500 mt-1">{errors.batch_id.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Date *</label>
            <input type="date" {...register('session_date')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            {errors.session_date && <p className="text-xs text-red-500 mt-1">{errors.session_date.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Topic (optional)</label>
            <input {...register('topic')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Quadratic Equations" />
          </div>
        </div>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal open={!!markModal} onClose={() => setMarkModal(null)} title={`Mark Attendance — ${markModal ? format(new Date(markModal.session_date), 'dd MMM yyyy') : ''}`} size="md"
        footer={<>
          <button onClick={() => setMarkModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={saveAttendance} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </>}>
        {sessionStudents.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No enrolled students in this batch.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} className="text-xs" /> {sessionStudents.length} students
              </p>
              <div className="flex gap-2">
                <button onClick={() => markAll('PRESENT')} className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg cursor-pointer">All Present</button>
                <button onClick={() => markAll('ABSENT')} className="text-xs px-2.5 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg cursor-pointer">All Absent</button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
              {sessionStudents.map(s => {
                const status = attendance[s.student_profile_id] || 'PRESENT';
                return (
                  <div key={s.student_profile_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['PRESENT', 'LATE', 'ABSENT'] as const).map(st => (
                        <button key={st} onClick={() => setAttendance(prev => ({ ...prev, [s.student_profile_id]: st }))}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                            status === st
                              ? st === 'PRESENT' ? 'bg-emerald-600 text-white'
                                : st === 'LATE' ? 'bg-amber-500 text-white'
                                : 'bg-red-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}>
                          {st === 'PRESENT' ? <FontAwesomeIcon icon={faCheckCircle} className="mr-1" /> : st === 'ABSENT' ? <FontAwesomeIcon icon={faCircleXmark} className="mr-1" /> : <FontAwesomeIcon icon={faClock} className="mr-1" />}
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Session" size="sm"
        footer={<>
          <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer">Delete</button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete the session on <strong>{deleteModal ? format(new Date(deleteModal.session_date), 'dd MMM yyyy') : ''}</strong> for <strong>{deleteModal?.batch_name}</strong>? All attendance records for this session will also be deleted.
        </p>
      </Modal>
    </div>
  );
}
