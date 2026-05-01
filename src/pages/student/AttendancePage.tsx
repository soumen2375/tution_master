import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays, faCheckCircle, faCircleXmark, faClock,
  faFilter, faChalkboard,
} from '@fortawesome/free-solid-svg-icons';
import EmptyState from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AttRecord {
  id: string;
  session_date: string;
  topic: string | null;
  batch_name: string;
  batch_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface Batch { id: string; name: string; }

const STATUS_ICON: Record<string, any> = {
  PRESENT: faCheckCircle,
  ABSENT: faCircleXmark,
  LATE: faClock,
};
const STATUS_BADGE: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState('');

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
        const batchIds = batchList.map(b => b.id);
        if (!batchIds.length) { setLoading(false); return; }

        const { data: attData, error } = await supabase
          .from('attendance_records')
          .select(`id, status,
            session:attendance_sessions(id, session_date, topic, batch_id, batch:batches(name))`)
          .eq('student_id', student.id);

        if (error) throw error;
        const recs: AttRecord[] = (attData || [])
          .filter((a: any) => batchIds.includes(a.session?.batch_id))
          .map((a: any) => ({
            id: a.id,
            session_date: a.session?.session_date || '',
            topic: a.session?.topic || null,
            batch_id: a.session?.batch_id || '',
            batch_name: a.session?.batch?.name || '',
            status: a.status,
          }))
          .sort((x: AttRecord, y: AttRecord) => new Date(y.session_date).getTime() - new Date(x.session_date).getTime());
        setRecords(recs);
      } catch (e: any) { toast.error('Failed to load attendance'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => batchFilter ? records.filter(r => r.batch_id === batchFilter) : records, [records, batchFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter(r => r.status === 'PRESENT').length;
    const late = filtered.filter(r => r.status === 'LATE').length;
    const absent = filtered.filter(r => r.status === 'ABSENT').length;
    const pct = total > 0 ? Math.round(((present + late) / total) * 100) : null;
    return { total, present, late, absent, pct };
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Attendance</h2>
        <p className="text-sm text-slate-500 mt-0.5">{records.length} sessions recorded</p>
      </div>

      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Overall', value: stats.pct !== null ? `${stats.pct}%` : 'N/A', color: stats.pct !== null && stats.pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Present', value: stats.present, color: 'text-emerald-700 dark:text-emerald-400' },
            { label: 'Late', value: stats.late, color: 'text-amber-700 dark:text-amber-400' },
            { label: 'Absent', value: stats.absent, color: 'text-red-600 dark:text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {batches.length > 1 && (
        <div className="flex gap-3">
          <div className="relative">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <table className="data-table"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={faCalendarDays} title="No Attendance Records"
            description={batchFilter ? 'No records for this batch.' : 'Your attendance will appear here once your teacher marks sessions.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch</th>
                  <th>Topic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400 text-xs" />
                        <span className="text-sm text-slate-900 dark:text-slate-100">
                          {r.session_date ? format(new Date(r.session_date), 'dd MMM yyyy') : '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <FontAwesomeIcon icon={faChalkboard} className="text-slate-400 text-xs" />
                        {r.batch_name}
                      </div>
                    </td>
                    <td><span className="text-sm text-slate-500">{r.topic || '—'}</span></td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[r.status] || STATUS_BADGE.ABSENT}`}>
                        <FontAwesomeIcon icon={STATUS_ICON[r.status] || faCircleXmark} className="mr-1 text-xs" />
                        {r.status}
                      </span>
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
