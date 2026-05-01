import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChalkboard, faArrowRightToBracket, faUser,
  faIndianRupeeSign, faCalendar, faBook,
} from '@fortawesome/free-solid-svg-icons';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EnrolledBatch {
  enrollment_id: string;
  batch_id: string;
  batch_name: string;
  subject: string | null;
  type: string | null;
  monthly_fee: number | null;
  teacher_name: string;
  enrolled_at: string;
  status: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<EnrolledBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
        if (!student) return;

        const { data, error } = await supabase
          .from('enrollments')
          .select(`id, batch_id, enrolled_at, status,
            batch:batches(id, name, subject, type, monthly_fee,
              teacher:teacher_profiles(profile:profiles(full_name)))`)
          .eq('student_id', student.id)
          .order('enrolled_at', { ascending: false });

        if (error) throw error;
        setBatches((data || []).map((e: any) => ({
          enrollment_id: e.id,
          batch_id: e.batch_id,
          batch_name: e.batch?.name || '',
          subject: e.batch?.subject || null,
          type: e.batch?.type || null,
          monthly_fee: e.batch?.monthly_fee || null,
          teacher_name: e.batch?.teacher?.profile?.full_name || 'Teacher',
          enrolled_at: e.enrolled_at,
          status: e.status,
        })));
      } catch (e: any) { toast.error('Failed to load batches'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    DROPPED: 'bg-red-100 text-red-700',
    PAUSED: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">My Batches</h2>
          <p className="text-sm text-slate-500 mt-0.5">{batches.filter(b => b.status === 'ACTIVE').length} active enrollments</p>
        </div>
        <Link to="/student/join"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <FontAwesomeIcon icon={faArrowRightToBracket} /> Join Batch
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <EmptyState icon={faChalkboard} title="No Batches Yet"
            description="Join a batch using the invite code from your teacher."
            action={{ label: '+ Join Batch', onClick: () => {} }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(batch => (
            <div key={batch.enrollment_id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                  {batch.batch_name.charAt(0).toUpperCase()}
                </div>
                <span className={`badge ${STATUS_COLOR[batch.status] || STATUS_COLOR.ACTIVE}`}>{batch.status}</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{batch.batch_name}</h3>
              {batch.subject && <p className="text-xs text-slate-500 mb-3">{batch.subject}</p>}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FontAwesomeIcon icon={faUser} className="text-slate-400 w-3" />
                  {batch.teacher_name}
                </div>
                {batch.monthly_fee && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="text-slate-400 w-3" />
                    ₹{batch.monthly_fee.toLocaleString('en-IN')}/month
                  </div>
                )}
                {batch.type && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FontAwesomeIcon icon={faBook} className="text-slate-400 w-3" />
                    {batch.type}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FontAwesomeIcon icon={faCalendar} className="text-slate-400 w-3" />
                  Joined {format(new Date(batch.enrolled_at), 'dd MMM yyyy')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
