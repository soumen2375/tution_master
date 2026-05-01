import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faMagnifyingGlass, faPlus, faTrash,
  faChevronLeft, faChevronRight, faFilter,
  faPhone, faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

interface StudentRow {
  enrollment_id: string;
  student_profile_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  batch_id: string;
  batch_name: string;
  enrolled_at: string;
  status: string;
}

interface Batch { id: string; name: string; }

const addSchema = z.object({
  lookup: z.string().min(6, 'Enter student ID (STU-XXXXXXXX) or phone number'),
  batch_id: z.string().min(1, 'Select a batch'),
});
type AddForm = z.infer<typeof addSchema>;

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<StudentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddForm>({
    resolver: zodResolver(addSchema),
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tp } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single();
    if (!tp) return;
    setTeacherId(tp.id);

    const { data: batchData } = await supabase.from('batches').select('id,name').eq('teacher_id', tp.id).eq('status', 'ACTIVE');
    setBatches(batchData || []);
    const batchIds = (batchData || []).map(b => b.id);
    if (!batchIds.length) { setLoading(false); return; }

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id, batch_id, enrolled_at, status,
        student:student_profiles(id, user_id, profile:profiles(full_name, phone)),
        batch:batches(name)
      `)
      .in('batch_id', batchIds)
      .eq('status', 'ACTIVE')
      .order('enrolled_at', { ascending: false });

    if (error) { toast.error('Failed to load students'); setLoading(false); return; }

    // Fetch emails from auth — not directly accessible; use profiles approach
    const rows: StudentRow[] = (enrollments || []).map((e: any) => ({
      enrollment_id: e.id,
      student_profile_id: e.student?.id || '',
      user_id: e.student?.user_id || '',
      full_name: e.student?.profile?.full_name || 'Unknown',
      email: '',
      phone: e.student?.profile?.phone || null,
      batch_id: e.batch_id,
      batch_name: e.batch?.name || '',
      enrolled_at: e.enrolled_at,
      status: e.status,
    }));
    setStudents(rows);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let s = students;
    if (search) s = s.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search));
    if (batchFilter) s = s.filter(r => r.batch_id === batchFilter);
    return s;
  }, [students, search, batchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function onAdd(data: AddForm) {
    setSaving(true);
    try {
      const lookup = data.lookup.trim().toUpperCase();
      let studentProfileId: string | null = null;
      let studentName = 'Student';

      if (lookup.startsWith('STU-')) {
        // Lookup by Student ID
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('id, student_code, profile:profiles(full_name)')
          .eq('student_code', lookup)
          .maybeSingle();
        if (!sp) { toast.error('No student found with that Student ID.'); return; }
        studentProfileId = sp.id;
        studentName = (sp as any).profile?.full_name || 'Student';
      } else {
        // Lookup by phone number
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('phone', data.lookup.trim())
          .eq('role', 'STUDENT')
          .maybeSingle();
        if (!profile) { toast.error('No registered student found with that phone number.'); return; }

        const { data: sp } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();
        if (!sp) { toast.error('Student has not completed onboarding yet.'); return; }
        studentProfileId = sp.id;
        studentName = profile.full_name || 'Student';
      }

      const { error } = await supabase.from('enrollments').insert({
        student_id: studentProfileId,
        batch_id: data.batch_id,
        status: 'ACTIVE',
      });

      if (error) {
        if (error.code === '23505') throw new Error('Student is already enrolled in this batch.');
        throw error;
      }

      toast.success(`${studentName} enrolled successfully!`);
      setAddModal(false);
      reset();
      await loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!removeModal) return;
    try {
      const { error } = await supabase.from('enrollments').update({ status: 'DROPPED' }).eq('id', removeModal.enrollment_id);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.enrollment_id !== removeModal.enrollment_id));
      toast.success(`${removeModal.full_name} removed from batch`);
      setRemoveModal(null);
    } catch (e: any) { toast.error(e.message); }
  }

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    DROPPED: 'bg-red-100 text-red-700',
    PAUSED: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Students</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} enrolled</p>
        </div>
        <button onClick={() => { reset(); setAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by name or phone..." />
        </div>
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <table className="data-table"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={faUsers} title="No Students Found"
            description={search || batchFilter ? 'Try adjusting your filters.' : 'Share your batch join code with students to get started.'}
            action={!search && !batchFilter ? { label: '+ Add Student', onClick: () => setAddModal(true) } : undefined} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Batch</th>
                    <th>Enrolled</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(s => (
                    <tr key={s.enrollment_id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                            {s.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{s.full_name}</span>
                        </div>
                      </td>
                      <td>
                        {s.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FontAwesomeIcon icon={faPhone} className="text-slate-400" />
                            {s.phone}
                          </div>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td><span className="text-sm text-slate-600 dark:text-slate-400">{s.batch_name}</span></td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
                          {format(new Date(s.enrolled_at), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td><span className={`badge ${STATUS_COLOR[s.status] || STATUS_COLOR.ACTIVE}`}>{s.status}</span></td>
                      <td>
                        <button onClick={() => setRemoveModal(s)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                          <FontAwesomeIcon icon={faTrash} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer">
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                  </button>
                  <span className="text-xs text-slate-600 dark:text-slate-400 px-2">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer">
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Student" size="sm"
        footer={<>
          <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onAdd)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Adding...' : 'Add Student'}
          </button>
        </>}>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
            The student must have registered first. Enter their <strong>Student ID</strong> (STU-XXXXXXXX from their settings) or their registered <strong>phone number</strong>.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Student ID or Phone *</label>
            <input {...register('lookup')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="STU-XXXXXXXX or +91 98765 43210" />
            {errors.lookup && <p className="text-xs text-red-500 mt-1">{errors.lookup.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Assign to Batch *</label>
            <select {...register('batch_id')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.batch_id && <p className="text-xs text-red-500 mt-1">{errors.batch_id.message}</p>}
          </div>
        </div>
      </Modal>

      {/* Remove confirm */}
      <Modal open={!!removeModal} onClose={() => setRemoveModal(null)} title="Remove Student" size="sm"
        footer={<>
          <button onClick={() => setRemoveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleRemove} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer">Remove</button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Remove <strong className="text-slate-900 dark:text-slate-100">{removeModal?.full_name}</strong> from <strong>{removeModal?.batch_name}</strong>? They will be marked as dropped.
        </p>
      </Modal>
    </div>
  );
}
