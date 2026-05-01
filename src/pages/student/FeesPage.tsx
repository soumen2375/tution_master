import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faCheckCircle, faClock, faCircleXmark,
  faFilter, faCalendar, faIndianRupeeSign,
} from '@fortawesome/free-solid-svg-icons';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FeeRow {
  id: string;
  batch_name: string;
  batch_id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  due_date: string | null;
  paid_at: string | null;
  month_label: string | null;
}

interface Batch { id: string; name: string; }

const STATUS_COLOR: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function FeesPage() {
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
        if (!student) return;

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('batch_id, batch:batches(name)')
          .eq('student_id', student.id)
          .eq('status', 'ACTIVE');

        const batchList: Batch[] = (enrollments || []).map((e: any) => ({ id: e.batch_id, name: e.batch?.name || '' }));
        setBatches(batchList);

        const { data: feeData, error } = await supabase
          .from('fee_payments')
          .select('id, batch_id, amount, status, due_date, paid_at, month_label, batch:batches(name)')
          .eq('student_id', student.id)
          .order('due_date', { ascending: false });

        if (error) throw error;
        setFees((feeData || []).map((f: any) => ({
          id: f.id,
          batch_id: f.batch_id,
          batch_name: f.batch?.name || '',
          amount: Number(f.amount),
          status: f.status,
          due_date: f.due_date,
          paid_at: f.paid_at,
          month_label: f.month_label,
        })));
      } catch (e: any) { toast.error('Failed to load fees'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let f = fees;
    if (batchFilter) f = f.filter(r => r.batch_id === batchFilter);
    if (statusFilter) f = f.filter(r => r.status === statusFilter);
    return f;
  }, [fees, batchFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: fees.reduce((s, f) => s + f.amount, 0),
    paid: fees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0),
    pending: fees.filter(f => f.status === 'PENDING').reduce((s, f) => s + f.amount, 0),
    overdue: fees.filter(f => f.status === 'OVERDUE').reduce((s, f) => s + f.amount, 0),
  }), [fees]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Fees</h2>
        <p className="text-sm text-slate-500 mt-0.5">{fees.length} records total</p>
      </div>

      {!loading && fees.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Billed', value: `₹${stats.total.toLocaleString('en-IN')}`, icon: faIndianRupeeSign, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
            { label: 'Paid', value: `₹${stats.paid.toLocaleString('en-IN')}`, icon: faCheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'Pending', value: `₹${stats.pending.toLocaleString('en-IN')}`, icon: faClock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Overdue', value: `₹${stats.overdue.toLocaleString('en-IN')}`, icon: faCircleXmark, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{s.label}</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                  <FontAwesomeIcon icon={s.icon} className="text-xs" />
                </div>
              </div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {batches.length > 1 && (
          <div className="relative">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
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
          <table className="data-table"><tbody>{Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={faMoneyBillWave} title="No Fee Records"
            description={batchFilter || statusFilter ? 'Try adjusting your filters.' : 'Your fee records will appear here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(fee => (
                  <tr key={fee.id}>
                    <td><span className="text-sm font-medium text-slate-900 dark:text-slate-100">{fee.batch_name}</span></td>
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
                    <td>
                      <div>
                        <span className={`badge ${STATUS_COLOR[fee.status] || STATUS_COLOR.PENDING}`}>{fee.status}</span>
                        {fee.status === 'PAID' && fee.paid_at && (
                          <p className="text-xs text-slate-400 mt-0.5">Paid {format(new Date(fee.paid_at), 'dd MMM')}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
