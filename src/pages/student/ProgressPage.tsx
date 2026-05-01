import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowTrendUp, faCalendarDays, faCheckCircle,
  faCircleXmark, faClock,
} from '@fortawesome/free-solid-svg-icons';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

interface BatchProgress {
  batch_id: string;
  batch_name: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  pct: number | null;
}

export default function ProgressPage() {
  const [batchProgress, setBatchProgress] = useState<BatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

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

        const batchMap = new Map<string, string>();
        (enrollments || []).forEach((e: any) => batchMap.set(e.batch_id, e.batch?.name || ''));
        const batchIds = Array.from(batchMap.keys());
        if (!batchIds.length) { setLoading(false); return; }

        const { data: attData } = await supabase
          .from('attendance')
          .select('status, session:sessions(batch_id)')
          .eq('student_id', student.id);

        const progMap = new Map<string, { total: number; present: number; late: number; absent: number }>();
        batchIds.forEach(id => progMap.set(id, { total: 0, present: 0, late: 0, absent: 0 }));
        (attData || []).forEach((a: any) => {
          const bid = a.session?.batch_id;
          if (bid && progMap.has(bid)) {
            const entry = progMap.get(bid)!;
            entry.total++;
            if (a.status === 'PRESENT') entry.present++;
            else if (a.status === 'LATE') entry.late++;
            else entry.absent++;
          }
        });

        const prog: BatchProgress[] = batchIds.map(id => {
          const e = progMap.get(id)!;
          return {
            batch_id: id,
            batch_name: batchMap.get(id) || '',
            ...e,
            pct: e.total > 0 ? Math.round(((e.present + e.late) / e.total) * 100) : null,
          };
        });
        setBatchProgress(prog);
      } catch (e: any) { toast.error('Failed to load progress'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const overall = batchProgress.length > 0 ? (() => {
    const total = batchProgress.reduce((s, b) => s + b.total, 0);
    const present = batchProgress.reduce((s, b) => s + b.present + b.late, 0);
    return total > 0 ? Math.round((present / total) * 100) : null;
  })() : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-48 rounded-xl skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Progress</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your attendance overview across all batches</p>
      </div>

      {batchProgress.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <EmptyState icon={faArrowTrendUp} title="No Progress Data"
            description="Join a batch and attend classes to see your progress here." />
        </div>
      ) : (
        <>
          {/* Overall summary */}
          {overall !== null && (
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
              <p className="text-indigo-200 text-sm mb-2">Overall Attendance</p>
              <div className="flex items-end gap-3 mb-4">
                <p className="text-5xl font-bold">{overall}%</p>
                <p className="text-indigo-200 text-sm mb-2">
                  {overall >= 75 ? 'Great work! Keep it up.' : 'Needs improvement. Try to attend more classes.'}
                </p>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overall}%` }} />
              </div>
            </div>
          )}

          {/* Per-batch cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {batchProgress.map(bp => (
              <div key={bp.batch_id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{bp.batch_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{bp.total} sessions total</p>
                  </div>
                  <div className={`text-2xl font-bold ${bp.pct !== null && bp.pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {bp.pct !== null ? `${bp.pct}%` : 'N/A'}
                  </div>
                </div>
                {bp.pct !== null && (
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${bp.pct >= 75 ? 'bg-emerald-500' : 'bg-red-400'}`}
                      style={{ width: `${bp.pct}%` }} />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: faCheckCircle, label: 'Present', value: bp.present, color: 'text-emerald-600 dark:text-emerald-400' },
                    { icon: faClock, label: 'Late', value: bp.late, color: 'text-amber-600 dark:text-amber-400' },
                    { icon: faCircleXmark, label: 'Absent', value: bp.absent, color: 'text-red-500 dark:text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <FontAwesomeIcon icon={s.icon} className={`text-sm mb-1 ${s.color}`} />
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-xs" />
                  {bp.total === 0 ? 'No sessions yet' : `${bp.total} sessions recorded`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
