import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Users, Calendar, IndianRupee, TrendingUp, Plus, ArrowRight,
  CheckCircle2, Bell, BookOpen, Zap, Award, Clock, GraduationCap,
  ChevronRight, AlertCircle, Sparkles, Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';

const weekData = [
  { name: 'Mon', sessions: 4, students: 38 },
  { name: 'Tue', sessions: 3, students: 30 },
  { name: 'Wed', sessions: 5, students: 45 },
  { name: 'Thu', sessions: 2, students: 18 },
  { name: 'Fri', sessions: 6, students: 52 },
  { name: 'Sat', sessions: 4, students: 36 },
];

const feeData = [
  { name: 'Paid', value: 68, color: '#10b981' },
  { name: 'Pending', value: 22, color: '#f59e0b' },
  { name: 'Overdue', value: 10, color: '#ef4444' },
];

const monthlyRevenue = [
  { month: 'Jan', revenue: 24000 },
  { month: 'Feb', revenue: 28000 },
  { month: 'Mar', revenue: 31000 },
  { month: 'Apr', revenue: 29000 },
  { month: 'May', revenue: 35000 },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [greeting, setGreeting] = useState('Good morning');
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');

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

  const firstName = (profile?.full_name as string)?.split(' ')[0] || 'Teacher';

  const stats = [
    { label: 'Active Students', value: '48', change: '+3 this week', up: true, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950', link: '/teacher/students' },
    { label: "Today's Sessions", value: '4', change: '2 completed', up: null, icon: Calendar, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950', link: '/teacher/batches' },
    { label: 'Pending Fees', value: '₹4,500', change: '6 students overdue', up: false, icon: IndianRupee, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950', link: '/teacher/fees' },
    { label: 'Attendance Rate', value: '92%', change: '+2% vs last month', up: true, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950', link: '/teacher/students' },
  ];

  const quickActions = [
    { label: 'New Batch', icon: Plus, gradient: 'from-rose-500 to-pink-600', link: '/teacher/batches/new' },
    { label: 'Mark Attendance', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500', link: '/teacher/batches' },
    { label: 'Collect Fee', icon: IndianRupee, gradient: 'from-amber-500 to-orange-500', link: '/teacher/fees' },
    { label: 'Post Notice', icon: Bell, gradient: 'from-violet-500 to-purple-600', link: '/teacher/announcements' },
    { label: 'Upload Notes', icon: BookOpen, gradient: 'from-blue-500 to-indigo-600', link: '/teacher/materials' },
  ];

  const todaySessions = [
    { time: '08:00 AM', batch: 'Class 10 — Mathematics', students: 12, status: 'done' },
    { time: '11:00 AM', batch: 'Class 12 — Physics', students: 8, status: 'done' },
    { time: '04:00 PM', batch: 'JEE Main Batch', students: 15, status: 'upcoming' },
    { time: '06:00 PM', batch: 'Class 9 — Science', students: 10, status: 'upcoming' },
  ];

  const recentActivities = [
    { type: 'payment', icon: IndianRupee, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950', title: 'Fee Received', desc: 'Rahul Sharma paid ₹500 for May', time: '2 hrs ago' },
    { type: 'attendance', icon: CheckCircle2, iconColor: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-950', title: 'Attendance Marked', desc: 'Class 10 Math — 11/12 present', time: '3 hrs ago' },
    { type: 'student', icon: Users, iconColor: 'text-violet-600', iconBg: 'bg-violet-50 dark:bg-violet-950', title: 'New Enrollment', desc: 'Priya Verma joined JEE Batch', time: '1 day ago' },
    { type: 'note', icon: BookOpen, iconColor: 'text-amber-600', iconBg: 'bg-amber-50 dark:bg-amber-950', title: 'Note Uploaded', desc: 'Trigonometry Formula Sheet added', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ── */}
      <div className="rounded-2xl relative overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 40%, #9f1239 100%)' }}>
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full opacity-10 translate-y-1/2"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-rose-200" />
              <p className="text-rose-200 text-xs font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{greeting}, {firstName}! 👋</h2>
            <p className="text-rose-100 text-sm">You have <strong>4 sessions</strong> today · <strong>6 pending fees</strong> to collect</p>
          </div>
          <div className="flex gap-3 flex-wrap shrink-0">
            <Button className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm text-sm h-9"
              onClick={() => navigate('/teacher/batches')}>
              <Calendar size={15} className="mr-1.5" /> View Schedule
            </Button>
            <Button className="bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm h-9"
              onClick={() => navigate('/teacher/batches/new')}>
              <Plus size={15} className="mr-1.5" /> New Batch
            </Button>
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
                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black mb-1">{stat.value}</p>
              {stat.change && (
                <p className={cn('text-xs font-semibold',
                  stat.up === true ? 'text-emerald-600 dark:text-emerald-400'
                  : stat.up === false ? 'text-rose-500 dark:text-rose-400'
                  : 'text-muted-foreground')}>
                  {stat.up === true ? '↑ ' : stat.up === false ? '↓ ' : ''}{stat.change}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.link}>
              <button className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all bg-gradient-to-r',
                action.gradient
              )}>
                <action.icon size={15} />
                {action.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left 2/3 */}
        <div className="xl:col-span-2 space-y-5">

          {/* Chart with tab toggle */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Sessions & Revenue</CardTitle>
                <CardDescription>
                  {activeTab === 'week' ? 'Classes held and students this week' : 'Monthly revenue trend'}
                </CardDescription>
              </div>
              <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--feature-card-bg)' }}>
                {(['week', 'month'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                      activeTab === t
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground')}>
                    {t}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'week' ? (
                  <BarChart data={weekData} barGap={4} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(225,29,72,0.05)', radius: 8 }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--card-bg)' }}
                    />
                    <Bar dataKey="sessions" fill="#e11d48" radius={[6, 6, 0, 0]} name="Sessions" />
                    <Bar dataKey="students" fill="#fda4af" radius={[6, 6, 0, 0]} name="Students" />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--card-bg)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#e11d48" fill="url(#revGrad)" strokeWidth={3} dot={{ r: 5, fill: '#e11d48' }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Clock size={17} className="text-primary" /> Today's Schedule</CardTitle>
                <CardDescription>4 sessions — 2 done, 2 upcoming</CardDescription>
              </div>
              <Link to="/teacher/batches">
                <Button variant="ghost" size="sm" className="text-xs h-8">View All <ChevronRight size={13} /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {todaySessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border group hover:border-primary transition-all"
                  style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--feature-card-bg)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl border flex items-center justify-center font-bold text-xs text-center leading-tight shrink-0"
                      style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
                      {s.time.split(':')[0]}<br />
                      <span className="text-[9px] font-normal text-muted-foreground">{s.time.includes('PM') ? 'PM' : 'AM'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{s.batch}</p>
                      <p className="text-xs text-muted-foreground">{s.time} · {s.students} students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                      s.status === 'done'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    )}>
                      {s.status}
                    </span>
                    {s.status === 'upcoming' && (
                      <Link to="/teacher/batches">
                        <Button size="sm" variant="outline" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Mark
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest events in your coaching centre</CardDescription>
              </div>
              <Link to="/teacher/students">
                <Button variant="ghost" size="sm" className="text-xs h-8">View Log <ChevronRight size={13} /></Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className={cn('p-2 rounded-xl shrink-0', a.iconBg)}>
                    <a.icon size={15} className={a.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase shrink-0 mt-0.5">{a.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">

          {/* Fee Collection Donut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Fee Collection — May</CardTitle>
              <CardDescription>₹24,000 of ₹35,000 collected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-28 h-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={feeData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value">
                        {feeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {feeData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700" style={{ width: '68%' }} />
              </div>
              <p className="text-xs text-muted-foreground mb-4">68% collected · ₹11,000 remaining</p>
              <Link to="/teacher/fees">
                <Button variant="outline" className="w-full h-8 text-xs">
                  View All Fees <ArrowRight size={13} className="ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Plan Usage */}
          <Card className="border-amber-200 dark:border-amber-800" style={{ background: 'var(--feature-card-bg)' }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 shrink-0">
                  <Zap size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">FREE Plan</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">9/10 students used</p>
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { label: 'Students', used: 9, max: 10 },
                  { label: 'Batches', used: 1, max: 1 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold">{item.used}/{item.max}</span>
                    </div>
                    <div className="h-1.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${(item.used / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/teacher/settings">
                <Button className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">
                  Upgrade — ₹199/mo
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Holidays */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award size={15} className="text-primary" /> Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Maharashtra Day', date: 'May 1', days: 1 },
                { name: 'Eid ul-Adha', date: 'Jun 7', days: 38 },
                { name: 'Guru Purnima', date: 'Jul 10', days: 71 },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-7 rounded-full bg-gradient-to-b from-rose-500 to-pink-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{h.days === 1 ? 'Tomorrow' : `In ${h.days} days`}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-muted-foreground font-mono">{h.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Alert */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 flex items-start gap-3">
            <AlertCircle size={17} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-sm text-rose-800 dark:text-rose-200">6 fee reminders pending</p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                Students haven't paid for May. Send reminders now.
              </p>
              <Link to="/teacher/fees">
                <Button size="sm" className="mt-2.5 h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white border-0">
                  Send Reminders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
