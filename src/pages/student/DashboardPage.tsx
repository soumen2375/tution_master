import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Calendar, IndianRupee, BookOpen, ArrowRight, Clock,
  GraduationCap, Play, TrendingUp, Bell, CheckCircle2,
  ChevronRight, Video, Sparkles, Target, Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const attendanceData = [
  { week: 'W1', pct: 80 }, { week: 'W2', pct: 100 },
  { week: 'W3', pct: 90 }, { week: 'W4', pct: 95 },
];

const subjectProgress = [
  { subject: 'Mathematics', progress: 72, color: '#e11d48' },
  { subject: 'Physics', progress: 58, color: '#8b5cf6' },
  { subject: 'Chemistry', progress: 84, color: '#10b981' },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    load();
  }, []);

  const firstName = (profile?.full_name as string)?.split(' ')[0] || 'Student';

  const stats = [
    { label: 'Attendance (Apr)', value: '94%', sub: '17/18 sessions', icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950', link: '/student/attendance' },
    { label: 'Next Fee Due', value: '₹500', sub: 'Due: May 10', icon: IndianRupee, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950', link: '/student/fees' },
    { label: 'Notes Available', value: '12', sub: '3 new this week', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950', link: '/student/notes' },
    { label: 'My Progress', value: 'B+', sub: 'Avg. score: 78%', icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950', link: '/student/progress' },
  ];

  const quickLinks = [
    { label: 'Attendance', icon: CheckCircle2, link: '/student/attendance', gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Pay Fees', icon: IndianRupee, link: '/student/fees', gradient: 'from-amber-500 to-orange-500' },
    { label: 'Notes', icon: BookOpen, link: '/student/notes', gradient: 'from-blue-500 to-indigo-500' },
    { label: 'Lectures', icon: Video, link: '/student/lectures', gradient: 'from-violet-500 to-purple-500' },
    { label: 'Progress', icon: TrendingUp, link: '/student/progress', gradient: 'from-rose-500 to-pink-500' },
    { label: 'Join Batch', icon: GraduationCap, link: '/student/join', gradient: 'from-slate-500 to-gray-600' },
  ];

  const upcomingClasses = [
    { time: '04:30 PM', subject: 'Mathematics — Trigonometry Part 2', teacher: 'Mr. Rahul Mehta', type: 'online', link: 'https://meet.google.com' },
    { time: '06:00 PM', subject: "Physics — Newton's Laws", teacher: 'Mrs. Priya Singh', type: 'offline', link: null },
  ];

  const recentNotes = [
    { title: 'Trigonometry Formula Sheet', type: 'PDF', size: '2.4 MB', isNew: true, link: '/student/notes' },
    { title: 'JEE 2026 Strategy Guide', type: 'PDF', size: '1.1 MB', isNew: true, link: '/student/notes' },
    { title: 'Physics Numericals Set 4', type: 'DOCX', size: '4.8 MB', isNew: false, link: '/student/notes' },
  ];

  const announcements = [
    {
      bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
      badgeColor: 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300',
      textColor: 'text-rose-900 dark:text-rose-100',
      badge: 'Urgent', title: 'Exam Rescheduled', body: 'Monthly test moved to May 8th. Check the new timetable.', time: '10:00 AM today',
    },
    {
      bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
      textColor: 'text-blue-900 dark:text-blue-100',
      badge: 'Notice', title: 'Chemistry Class Moved', body: "Tomorrow's class at 5 PM instead of 4 PM.", time: 'Yesterday',
    },
    {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300',
      textColor: 'text-emerald-900 dark:text-emerald-100',
      badge: 'Offer', title: 'Refer & Earn ₹500', body: 'Refer a friend to May batch and get ₹500 discount.', time: '2 days ago',
    },
  ];

  return (
    <div className="space-y-5">

      {/* ── Welcome Banner ── */}
      <div className="rounded-2xl relative overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 40%, #4c1d95 100%)' }}>
        <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 rounded-full opacity-10 -translate-y-1/3 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 translate-y-1/3 -translate-x-1/4"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-violet-300" />
              <p className="text-violet-200 text-xs font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{greeting}, {firstName}! 🎓</h2>
            <p className="text-violet-200 text-sm">You've attended <strong>94%</strong> of classes this month. Keep it up!</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/student/join">
              <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-sm h-9">
                + Join Batch
              </Button>
            </Link>
            <Link to="/student/attendance">
              <Button className="bg-white text-violet-700 hover:bg-violet-50 font-bold text-sm h-9">
                My Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <Link key={i} to={stat.link}>
            <div className="rounded-2xl border p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl', stat.bg)}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black mb-0.5">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick Links ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Access</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
          {quickLinks.map((ql, i) => (
            <Link key={i} to={ql.link}>
              <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all text-center group"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br group-hover:scale-110 transition-transform duration-200', ql.gradient)}>
                  <ql.icon size={17} />
                </div>
                <span className="text-[10px] sm:text-xs font-bold leading-tight">{ql.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left 2/3 */}
        <div className="xl:col-span-2 space-y-5">

          {/* Upcoming Classes */}
          {upcomingClasses.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
              <div className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--feature-card-bg)' }}>
                <p className="text-sm font-bold flex items-center gap-2">
                  <Clock size={15} className="text-violet-500" /> Upcoming Classes
                </p>
                <Link to="/student/attendance">
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    Full Schedule <ChevronRight size={13} />
                  </Button>
                </Link>
              </div>
              <div style={{ backgroundColor: 'var(--card-bg)' }}>
                {upcomingClasses.map((cls, i) => (
                  <div key={i} className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4',
                    i < upcomingClasses.length - 1 && 'border-b')}
                    style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 font-bold"
                        style={{ borderColor: 'var(--card-border)' }}>
                        <span className="text-lg leading-none">{cls.time.split(':')[0]}</span>
                        <span className="text-[9px] text-muted-foreground">{cls.time.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{cls.subject}</p>
                        <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                        <span className={cn('inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          cls.type === 'online'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        )}>
                          {cls.type}
                        </span>
                      </div>
                    </div>
                    {cls.link ? (
                      <a href={cls.link} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <Button size="sm" className="h-9 text-sm font-bold gap-2 bg-gradient-to-r from-violet-500 to-purple-600 border-0">
                          <Play size={13} /> Join Room
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" className="h-9 text-sm shrink-0" disabled>
                        Offline Class
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={17} className="text-violet-500" /> Attendance Trend
                  </CardTitle>
                  <CardDescription>Weekly percentage this month</CardDescription>
                </div>
                <Link to="/student/attendance">
                  <Button variant="ghost" size="sm" className="text-xs h-8">Details <ChevronRight size={13} /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="h-[200px] sm:h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={(v: unknown) => [`${v}%`, 'Attendance']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--card-bg)' }}
                  />
                  <Area type="monotone" dataKey="pct" stroke="#7c3aed" fill="url(#attGrad)" strokeWidth={3} dot={{ r: 5, fill: '#7c3aed', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={16} className="text-primary" /> Subject Progress
                  </CardTitle>
                  <CardDescription>Syllabus completion tracked by your teacher</CardDescription>
                </div>
                <Link to="/student/progress">
                  <Button variant="ghost" size="sm" className="text-xs h-8">Full Report <ChevronRight size={13} /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjectProgress.map((sp, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold">{sp.subject}</span>
                    <span className="font-bold" style={{ color: sp.color }}>{sp.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sp.progress}%`, backgroundColor: sp.color }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-5">

          {/* Streak Card */}
          <div className="rounded-2xl border p-5 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(225,29,72,0.08) 100%)', borderColor: 'var(--card-border)' }}>
            <Flame size={28} className="text-rose-500 mx-auto mb-2" />
            <p className="font-black text-2xl gradient-text">7-Day Streak!</p>
            <p className="text-sm text-muted-foreground mt-1 mb-3">You've attended class every day this week!</p>
            <div className="flex justify-center gap-1.5">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold',
                  i < 7 ? 'bg-gradient-to-br from-rose-500 to-pink-400 text-white shadow-sm' : 'bg-secondary text-muted-foreground'
                )}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen size={15} className="text-primary" /> Recent Notes
              </CardTitle>
              <Link to="/student/notes">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  All <ChevronRight size={13} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentNotes.map((note, i) => (
                <Link key={i} to={note.link}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all group"
                    style={{ borderColor: 'var(--card-border)' }}>
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <BookOpen size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{note.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{note.type} · {note.size}</p>
                    </div>
                    {note.isNew && (
                      <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded shrink-0">New</span>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Announcements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell size={14} className="text-primary" /> Announcements
              </h3>
              <Button variant="ghost" size="sm" className="text-xs h-7">View All</Button>
            </div>
            <div className="space-y-2.5">
              {announcements.map((ann, i) => (
                <div key={i} className={cn('p-3.5 rounded-2xl border', ann.bg)}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded-md', ann.badgeColor)}>
                      {ann.badge}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{ann.time}</span>
                  </div>
                  <p className={cn('text-sm font-bold mb-0.5', ann.textColor)}>{ann.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{ann.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
