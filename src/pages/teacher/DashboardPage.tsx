import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faChalkboard, faMoneyBillWave, faClock,
  faPlus, faCalendarPlus, faBullhorn,
  faUserPlus, faFileCirclePlus, faArrowTrendUp, faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { StatCardSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface Stats {
  totalStudents: number; activeBatches: number;
  feesCollectedThisMonth: number; pendingFees: number; studentsThisWeek: number;
}
interface Activity {
  id: string; type: 'student_joined'|'material_uploaded'|'announcement';
  message: string; time: string;
}

function StatCard({ icon, label, value, delta, deltaLabel, iconBg }: {
  icon: IconDefinition; label: string; value: string|number;
  delta?: number; deltaLabel?: string; iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <FontAwesomeIcon icon={icon} className="text-sm" />
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">{value}</p>
      {delta !== undefined && (
        <p className="text-xs font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <FontAwesomeIcon icon={faArrowTrendUp} className="text-xs" />+{delta} {deltaLabel}
        </p>
      )}
    </div>
  );
}

const ACT_CONFIG = {
  student_joined:    { icon: faUserPlus,      bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  material_uploaded: { icon: faFileCirclePlus, bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' },
  announcement:      { icon: faBullhorn,       bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' },
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats|null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileRes, teacherRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single(),
      ]);
      setTeacherName(profileRes.data?.full_name || 'Teacher');
      const teacherId = teacherRes.data?.id;
      if (!teacherId) { setLoading(false); return; }

      const { data: batchRows } = await supabase.from('batches').select('id').eq('teacher_id', teacherId);
      const batchIds = batchRows?.map(b => b.id) || [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const weekStart = new Date(now.getTime() - 7*24*60*60*1000).toISOString();

      if (batchIds.length === 0) {
        setStats({ totalStudents:0, activeBatches:0, feesCollectedThisMonth:0, pendingFees:0, studentsThisWeek:0 });
        setLoading(false); return;
      }

      const [activeBR, enrollR, feePaidR, feePendR, weekEnR, notesR, annR] = await Promise.all([
        supabase.from('batches').select('id',{count:'exact',head:true}).eq('teacher_id',teacherId).eq('status','ACTIVE'),
        supabase.from('enrollments').select('id,enrolled_at',{count:'exact'}).in('batch_id',batchIds).eq('status','ACTIVE'),
        supabase.from('fee_payments').select('amount').in('batch_id',batchIds).eq('status','PAID').gte('paid_at',monthStart),
        supabase.from('fee_payments').select('id',{count:'exact',head:true}).in('batch_id',batchIds).in('status',['PENDING','OVERDUE']),
        supabase.from('enrollments').select('id',{count:'exact',head:true}).in('batch_id',batchIds).gte('enrolled_at',weekStart),
        supabase.from('notes').select('id,title,created_at').in('batch_id',batchIds).order('created_at',{ascending:false}).limit(3),
        supabase.from('announcements').select('id,title,created_at').eq('teacher_id',teacherId).order('created_at',{ascending:false}).limit(2),
      ]);

      const feesTotal = (feePaidR.data||[]).reduce((s,r)=>s+Number(r.amount),0);
      setStats({ totalStudents: enrollR.count??0, activeBatches: activeBR.count??0,
        feesCollectedThisMonth: feesTotal, pendingFees: feePendR.count??0, studentsThisWeek: weekEnR.count??0 });

      const acts: Activity[] = [];
      (enrollR.data||[]).slice(0,3).forEach(e=>acts.push({id:e.id,type:'student_joined',message:'A student joined your batch',time:e.enrolled_at}));
      (notesR.data||[]).forEach(n=>acts.push({id:n.id,type:'material_uploaded',message:`Material uploaded: ${n.title}`,time:n.created_at}));
      (annR.data||[]).forEach(a=>acts.push({id:a.id,type:'announcement',message:`Announcement: ${a.title}`,time:a.created_at}));
      acts.sort((a,b)=>new Date(b.time).getTime()-new Date(a.time).getTime());
      setActivities(acts.slice(0,5));
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  }

  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting}, {teacherName.split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{format(new Date(),'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FontAwesomeIcon icon={faChartLine} className="text-indigo-500" />Overview updated just now
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i)=><StatCardSkeleton key={i}/>) : (<>
          <StatCard icon={faUsers} label="Total Students" value={stats?.totalStudents??0}
            delta={stats?.studentsThisWeek} deltaLabel="this week"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"/>
          <StatCard icon={faChalkboard} label="Active Batches" value={stats?.activeBatches??0}
            iconBg="bg-violet-100 dark:bg-violet-900/30 text-violet-600"/>
          <StatCard icon={faMoneyBillWave} label="Fees This Month"
            value={`₹${(stats?.feesCollectedThisMonth??0).toLocaleString('en-IN')}`}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"/>
          <StatCard icon={faClock} label="Pending Fees" value={stats?.pendingFees??0}
            iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600"/>
        </>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-slate-400">Loading...</div>
          ) : activities.length===0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No recent activity. Create your first batch to get started!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {activities.map(act=>{
                const {icon,bg}=ACT_CONFIG[act.type];
                return (
                  <div key={act.id} className="flex items-start gap-3 px-6 py-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                      <FontAwesomeIcon icon={icon} className="text-xs"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{act.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{format(new Date(act.time),'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            {[
              {icon:faPlus,        label:'New Batch',        path:'/teacher/batches',       color:'bg-indigo-600 hover:bg-indigo-700'},
              {icon:faUserPlus,    label:'Add Student',      path:'/teacher/students',      color:'bg-violet-600 hover:bg-violet-700'},
              {icon:faCalendarPlus,label:'Mark Attendance',  path:'/teacher/attendance',    color:'bg-emerald-600 hover:bg-emerald-700'},
              {icon:faBullhorn,    label:'New Announcement', path:'/teacher/announcements', color:'bg-amber-600 hover:bg-amber-700'},
            ].map(a=>(
              <button key={a.label} onClick={()=>navigate(a.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer ${a.color}`}>
                <FontAwesomeIcon icon={a.icon} className="w-4 shrink-0"/>{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
