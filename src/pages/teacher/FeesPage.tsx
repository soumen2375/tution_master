import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faMagnifyingGlass, faPlus, faTrash,
  faChevronLeft, faChevronRight, faFilter, faCheckCircle,
  faCalendar, faPenToSquare, faIndianRupeeSign, faClock, faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton, StatCardSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

interface FeeRow {
  id: string;
  student_name: string;
  student_profile_id: string;
  batch_id: string;
  batch_name: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  due_date: string | null;
  paid_at: string | null;
  month_label: string | null;
}

interface Batch { id: string; name: string; }
interface Student { student_profile_id: string; full_name: string; batch_id: string; batch_name: string; }

const feeSchema = z.object({
  student_profile_id: z.string().min(1, 'Select a student'),
  batch_id: z.string().min(1, 'Select a batch'),
  amount: z.number().min(1, 'Amount must be > 0'),
  due_date: z.string().min(1, 'Set a due date'),
  month_label: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']),
});
type FeeForm = z.infer<typeof feeSchema>;

export default function FeesPage() {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<FeeRow | null>(null);
  const [deleteModal, setDeleteModal] = useState<FeeRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FeeForm>({
    resolver: zodResolver(feeSchema),
    defaultValues: { status: 'PENDING' },
  });

  const watchBatchId = watch('batch_id');

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

    const [feesRes, enrollRes] = await Promise.all([
      supabase.from('fee_payments')
        .select(`id, amount, status, due_date, paid_at, month_label, batch_id,
          student:student_profiles(id, user_id, profile:profiles(full_name)),
          batch:batches(name)`)
        .in('batch_id', batchIds)
        .order('due_date', { ascending: false }),
      supabase.from('enrollments')
        .select('batch_id, student:student_profiles(id, profile:profiles(full_name))')
        .in('batch_id', batchIds)
        .eq('status', 'ACTIVE'),
    ]);

    const feeRows: FeeRow[] = (feesRes.data || []).map((f: any) => ({
      id: f.id,
      student_name: f.student?.profile?.full_name || 'Unknown',
      student_profile_id: f.student?.id || '',
      batch_id: f.batch_id,
      batch_name: f.batch?.name || '',
      amount: Number(f.amount),
      status: f.status,
      due_date: f.due_date,
      paid_at: f.paid_at,
      month_label: f.month_label,
    }));
    setFees(feeRows);

    const studentMap = new Map<string, Student>();
    const batchMap = new Map(batchData?.map(b => [b.id, b.name]) || []);
    (enrollRes.data || []).forEach((e: any) => {
      const sid = e.student?.id;
      if (sid && !studentMap.has(sid)) {
        studentMap.set(sid, {
          student_profile_id: sid,
          full_name: e.student?.profile?.full_name || 'Unknown',
          batch_id: e.batch_id,
          batch_name: batchMap.get(e.batch_id) || '',
        });
      }
    });
    setStudents(Array.from(studentMap.values()));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let s = fees;
    if (search) s = s.filter(r => r.student_name.toLowerCase().includes(search.toLowerCase()) || r.batch_name.toLowerCase().includes(search.toLowerCase()));
    if (batchFilter) s = s.filter(r => r.batch_id === batchFilter);
    if (statusFilter) s = s.filter(r => r.status === statusFilter);
    return s;
  }, [fees, search, batchFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: fees.reduce((s, f) => s + f.amount, 0),
    collected: fees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0),
    pending: fees.filter(f => f.status === 'PENDING').reduce((s, f) => s + f.amount, 0),
    overdue: fees.filter(f => f.status === 'OVERDUE').reduce((s, f) => s + f.amount, 0),
  }), [fees]);

  const filteredStudents = students.filter(s => !watchBatchId || s.batch_id === watchBatchId);

  function openAdd() { reset({ status: 'PENDING' }); setAddModal(true); }
  function openEdit(fee: FeeRow) {
    setEditModal(fee);
    reset({
      student_profile_id: fee.student_profile_id,
      batch_id: fee.batch_id,
      amount: fee.amount,
      due_date: fee.due_date ? fee.due_date.slice(0, 10) : '',
      month_label: fee.month_label || '',
      status: fee.status,
    });
  }

  async function onSubmit(data: FeeForm) {
    setSaving(true);
    try {
      const payload = {
        student_id: data.student_profile_id,
        batch_id: data.batch_id,
        amount: data.amount,
        status: data.status,
        due_date: data.due_date,
        month_label: data.month_label || null,
        paid_at: data.status === 'PAID' ? new Date().toISOString() : null,
      };
      if (editModal) {
        const { error } = await supabase.from('fee_payments').update(payload).eq('id', editModal.id);
        if (error) throw error;
        toast.success('Fee record updated');
        setEditModal(null);
      } else {
        const { error } = await supabase.from('fee_payments').insert(payload);
        if (error) throw error;
        toast.success('Fee record added');
        setAddModal(false);
      }
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleMarkPaid(fee: FeeRow) {
    try {
      const { error } = await supabase.from('fee_payments').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', fee.id);
      if (error) throw error;
      setFees(prev => prev.map(f => f.id === fee.id ? { ...f, status: 'PAID', paid_at: new Date().toISOString() } : f));
      toast.success(`${fee.student_name}'s fee marked as paid`);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      const { error } = await supabase.from('fee_payments').delete().eq('id', deleteModal.id);
      if (error) throw error;
      setFees(prev => prev.filter(f => f.id !== deleteModal.id));
      toast.success('Fee record deleted');
      setDeleteModal(null);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleBulkMarkPaid() {
    if (!selected.size) return;
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from('fee_payments').update({ status: 'PAID', paid_at: new Date().toISOString() }).in('id', ids);
      if (error) throw error;
      setFees(prev => prev.map(f => selected.has(f.id) ? { ...f, status: 'PAID', paid_at: new Date().toISOString() } : f));
      toast.success(`${ids.length} records marked as paid`);
      setSelected(new Set());
    } catch (e: any) { toast.error(e.message); }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectAll() {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(f => f.id)));
  }

  const STATUS_COLOR: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const FeeFormFields = () => (
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
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Student *</label>
        <select {...register('student_profile_id')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select student</option>
          {filteredStudents.map(s => <option key={s.student_profile_id} value={s.student_profile_id}>{s.full_name}</option>)}
        </select>
        {errors.student_profile_id && <p className="text-xs text-red-500 mt-1">{errors.student_profile_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Amount (₹) *</label>
          <input type="number" {...register('amount', { valueAsNumber: true })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="500" />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Status *</label>
          <select {...register('status')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Due Date *</label>
          <input type="date" {...register('due_date')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Month Label</label>
          <input {...register('month_label')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. May 2026" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Fee Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">{fees.length} records total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus} /> Add Fee Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
          <>
            {[
              { icon: faIndianRupeeSign, label: 'Total Billed', value: `₹${stats.total.toLocaleString('en-IN')}`, bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
              { icon: faCheckCircle, label: 'Collected', value: `₹${stats.collected.toLocaleString('en-IN')}`, bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
              { icon: faClock, label: 'Pending', value: `₹${stats.pending.toLocaleString('en-IN')}`, bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
              { icon: faCircleXmark, label: 'Overdue', value: `₹${stats.overdue.toLocaleString('en-IN')}`, bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <FontAwesomeIcon icon={stat.icon} className="text-xs" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{selected.size} selected</span>
          <button onClick={handleBulkMarkPaid}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer">
            <FontAwesomeIcon icon={faCheckCircle} /> Mark All as Paid
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">Clear</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by student or batch..." />
        </div>
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <table className="data-table"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={faMoneyBillWave} title="No Fee Records"
            description={search || batchFilter || statusFilter ? 'Try adjusting your filters.' : 'Add your first fee record to start tracking payments.'}
            action={!search && !batchFilter && !statusFilter ? { label: '+ Add Fee Record', onClick: openAdd } : undefined} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input type="checkbox" onChange={toggleSelectAll} checked={selected.size === paginated.length && paginated.length > 0}
                        className="rounded border-slate-300 accent-indigo-600 cursor-pointer" />
                    </th>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(fee => (
                    <tr key={fee.id}>
                      <td>
                        <input type="checkbox" checked={selected.has(fee.id)} onChange={() => toggleSelect(fee.id)}
                          className="rounded border-slate-300 accent-indigo-600 cursor-pointer" />
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                            {fee.student_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{fee.student_name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm text-slate-600 dark:text-slate-400">{fee.batch_name}</span></td>
                      <td><span className="text-sm text-slate-500">{fee.month_label || '—'}</span></td>
                      <td>
                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          <FontAwesomeIcon icon={faIndianRupeeSign} className="text-xs text-slate-400" />
                          {fee.amount.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        {fee.due_date ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
                            {format(new Date(fee.due_date), 'dd MMM yyyy')}
                          </div>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td><span className={`badge ${STATUS_COLOR[fee.status] || STATUS_COLOR.PENDING}`}>{fee.status}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {fee.status !== 'PAID' && (
                            <button onClick={() => handleMarkPaid(fee)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer"
                              title="Mark as Paid">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                            </button>
                          )}
                          <button onClick={() => openEdit(fee)}
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Edit">
                            <FontAwesomeIcon icon={faPenToSquare} className="text-sm" />
                          </button>
                          <button onClick={() => setDeleteModal(fee)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete">
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Fee Record" size="md"
        footer={<>
          <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Add Record'}
          </button>
        </>}>
        <FeeFormFields />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Fee Record" size="md"
        footer={<>
          <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>}>
        <FeeFormFields />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Fee Record" size="sm"
        footer={<>
          <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer">Delete</button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete fee record for <strong className="text-slate-900 dark:text-slate-100">{deleteModal?.student_name}</strong> — ₹{deleteModal?.amount.toLocaleString('en-IN')}? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
