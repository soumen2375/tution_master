import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays, faMoneyBillWave, faFolder, faArrowTrendUp,
  faArrowRightToBracket, faBullhorn, faChalkboard,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { StatCardSkeleton } from '@/components/shared/SkeletonLoader';
import { format } from 'date-fns';

interface Stats {
  totalBatches: number;
  attendancePct: number | null;
  pendingFees: number;
  materialCount: number;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  batch_name: string | null;
}

interface Batch {
  id: string;
  name: string;
  teacher_name: string;
  subject: string | null;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, studentRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('student_profiles').select('id').eq('user_id', user.id).single(),
      ]);
      setStudentName(profileRes.data?.full_name || 'Student');
      const studentId = studentRes.data?.id;
      if (!studentId) { setLoading(false); return; }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('batch_id, batch:batches(id, name, subject, teacher:teacher_profiles(user_id, profile:profiles(full_name)))')
        .eq('student_id', studentId)
        .eq('status', 'ACTIVE');

      const batchIds = (enrollments || []).map(e => e.batch_id);
      const batchList: Batch[] = (enrollments || []).map((e: any) => ({
        id: e.batch?.id || '',
        name: e.batch?.name || '',
        subject: e.batch?.subject || null,
        teacher_name: e.batch?.teacher?.profile?.full_name || 'Teacher',
      }));
      setBatches(batchList);

      if (!batchIds.length) {
        setStats({ totalBatches: 0, attendancePct: null, pendingFees: 0, materialCount: 0 });
        setLoading(false);
        return;
      }

      const [attRes, feesRes, notesRes, annRes] = await Promise.all([
        supabase.from('attendance').select('id, status, session:sessions(batch_id)').eq('student_id', studentId),
        supabase.from('fee_payments').select('id', { count: 'exact', head: true }).eq('student_id', studentId).in('status', ['PENDING', 'OVERDUE']),
        supabase.from('notes').select('id', { count: 'exact', head: true }).in('batch_id', batchIds),
        supabase.from('announcements')
          .select('id, title, body, created_at, batch:batches(name)')
          .in('batch_id', batchIds)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const allAtt = (attRes.data || []).filter((a: any) => batchIds.includes(a.session?.batch_id));
      const presentCount = allAtt.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const pct = allAtt.length > 0 ? Math.round((presentCount / allAtt.length) * 100) : null;

      setStats({
        totalBatches: batchList.length,
        attendancePct: pct,
        pendingFees: feesRes.count ?? 0,
        materialCount: notesRes.count ?? 0,
      });

      setAnnouncements((annRes.data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        created_at: a.created_at,
        batch_name: a.batch?.name || null,
      })));
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = studentName.split(' ')[0];

  const statCards = [
    { icon: faChalkboard, label: 'My Batches', value: stats?.totalBatches ?? 0, link: '/student/batches', bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
    { icon: faCalendarDays, label: 'Attendance', value: stats != null && stats.attendancePct != null ? `${stats.attendancePct}%` : 'N/A', link: '/student/attendance', bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { icon: faMoneyBillWave, label: 'Pending Fees', value: stats?.pendingFees ?? 0, link: '/student/fees', bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { icon: faFolder, label: 'Materials', value: stats?.materialCount ?? 0, link: '/student/notes', bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
  ];

  const quickLinks = [
    { icon: faChalkboard, label: 'My Batches', link: '/student/batches', color: 'bg-indigo-600' },
    { icon: faCalendarDays, label: 'Attendance', link: '/student/attendance', color: 'bg-emerald-600' },
    { icon: faMoneyBillWave, label: 'Fees', link: '/student/fees', color: 'bg-amber-600' },
    { icon: faFolder, label: 'Materials', link: '/student/notes', color: 'bg-violet-600' },
    { icon: faArrowTrendUp, label: 'Progress', link: '/student/progress', color: 'bg-rose-600' },
    { icon: faArrowRightToBracket, label: 'Join Batch', link: '/student/join', color: 'bg-slate-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm mb-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          <h2 className="text-2xl font-bold mb-1">{greeting}, {firstName}!</h2>
          <p className="text-indigo-200 text-sm">
            {stats?.attendancePct !== null && stats?.attendancePct !== undefined
              ? `Your attendance is ${stats.attendancePct}% this month. Keep it up!`
              : 'Welcome to TutionHut. Join a batch to get started!'}
          </p>
          <div className="flex gap-2 mt-4">
            <Link to="/student/batches" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors">
              My Batches
            </Link>
            <Link to="/student/join" className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-medium rounded-lg transition-colors">
              + Join Batch
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
          statCards.map(card => (
            <Link key={card.label} to={card.link}
              className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <FontAwesomeIcon icon={card.icon} className="text-sm" />
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </Link>
          ))
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickLinks.map(ql => (
            <Link key={ql.label} to={ql.link}
              className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:-translate-y-0.5 transition-all shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${ql.color}`}>
                <FontAwesomeIcon icon={ql.icon} className="text-sm" />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">{ql.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Batches */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">My Batches</h3>
            <Link to="/student/batches" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </Link>
          </div>
          {batches.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-400">You haven't joined any batches yet.</p>
              <Link to="/student/join" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                <FontAwesomeIcon icon={faArrowRightToBracket} /> Join a Batch
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {batches.slice(0, 4).map(batch => (
                <div key={batch.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                    {batch.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{batch.name}</p>
                    <p className="text-xs text-slate-500">{batch.teacher_name}{batch.subject ? ` · ${batch.subject}` : ''}</p>
                  </div>
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FontAwesomeIcon icon={faBullhorn} className="text-sm text-indigo-500" />
              Announcements
            </h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-lg skeleton" />)}
            </div>
          ) : announcements.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">No announcements yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {announcements.map(ann => (
                <div key={ann.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ann.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ann.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{format(new Date(ann.created_at), 'dd MMM · h:mm a')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
