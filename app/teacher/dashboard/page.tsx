'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Calendar, 
  IndianRupee, 
  TrendingUp,
  Plus,
  ArrowRight,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    todaySessions: 0,
    pendingFees: 0,
    newEnrollments: 0
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'attendance', title: 'Attendance Marked', desc: 'Class 10 Math Morning', time: '2 hours ago' },
    { id: 2, type: 'payment', title: 'Fee Received', desc: 'Rahul Sharma paid ₹500', time: '4 hours ago' },
    { id: 3, type: 'enrollment', title: 'New Student', desc: 'Priya Verma joined Class 12 Batch', time: '1 day ago' },
  ]);

  const chartData = [
    { name: 'Mon', sessions: 4 },
    { name: 'Tue', sessions: 3 },
    { name: 'Wed', sessions: 5 },
    { name: 'Thu', sessions: 2 },
    { name: 'Fri', sessions: 6 },
    { name: 'Sat', sessions: 4 },
  ];

  const revenueData = [
    { month: 'Jan', amount: 15000 },
    { month: 'Feb', amount: 18000 },
    { month: 'Mar', amount: 22000 },
    { month: 'Apr', amount: 25000 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Good morning, Sir!</h2>
          <p className="text-muted-foreground">Here is what is happening with your tuition today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">Schedule Class</Button>
          <Button><Plus className="mr-2" size={18} /> New Batch</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Students', value: '48', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: "Today's Sessions", value: '4', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Pending Fees', value: '₹4,500', icon: IndianRupee, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Attendance Rate', value: '92%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Session Overview</CardTitle>
              <CardDescription>Number of classes held this week</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sessions" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today&apos;s Schedule</CardTitle>
                  <CardDescription>4 classes scheduled</CardDescription>
                </div>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { time: '08:00 AM', batch: 'Class 10 - Math', students: 12 },
                  { time: '11:00 AM', batch: 'Class 12 - Physics', students: 8 },
                  { time: '04:00 PM', batch: 'JEE Main Batch', students: 15 },
                  { time: '06:00 PM', batch: 'Class 9 - Science', students: 10 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/10 group hover:border-primary transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-xs border shadow-sm">
                        {s.time.split(':')[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{s.batch}</p>
                        <p className="text-xs text-muted-foreground">{s.time} • {s.students} students</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Mark
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest happenings in your center</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center z-10 relative">
                        {activity.type === 'attendance' && <CheckCircle2 size={18} className="text-green-600" />}
                        {activity.type === 'payment' && <IndianRupee size={18} className="text-blue-600" />}
                        {activity.type === 'enrollment' && <Users size={18} className="text-orange-600" />}
                      </div>
                      {activity.id !== recentActivities.length && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-border" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.desc}</p>
                      <p className="text-[10px] uppercase font-bold mt-1 text-muted-foreground/60">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 pt-0">
                <Button variant="ghost" className="w-full text-xs" size="sm">
                  View Full Audit Log <ArrowRight className="ml-2" size={14} />
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Fee Collection Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold">₹24,000</span>
                <span className="text-primary-foreground/60 text-sm">/ ₹35,000</span>
              </div>
              <div className="h-2 w-full bg-primary-foreground/20 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-white w-[68%]" />
              </div>
              <p className="text-xs text-primary-foreground/80">68% collected. ₹11,000 remaining this month.</p>
            </CardContent>
            <div className="p-6 pt-0">
              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-none text-white">
                View Pending Fees
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Eid al-Fitr', date: 'Mar 31' },
                { name: 'Dr. Ambedkar Jayanti', date: 'Apr 14' },
                { name: 'Bengali New Year', date: 'Apr 15' },
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{h.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{h.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none bg-orange-50 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800 dark:text-orange-200">Upgrade Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                You have reached 90% of your current plan student limit (45/50). Upgrade to avoid disruptions.
              </p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 border-none">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
