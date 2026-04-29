'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  IndianRupee, 
  BookOpen, 
  ArrowRight,
  Clock,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const attendanceData = [
    { name: 'Week 1', score: 80 },
    { name: 'Week 2', score: 100 },
    { name: 'Week 3', score: 90 },
    { name: 'Week 4', score: 95 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">👋 Hello, {profile?.full_name?.split(' ')[0] || 'Student'}!</h2>
          <p className="text-muted-foreground">Keep up your momentum. You have 2 classes left this week.</p>
        </div>
        <Link href="/student/join">
          <Button variant="outline">Join New Batch</Button>
        </Link>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Attendance (Apr)', value: '94%', icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Next Payment Due', value: '₹500', icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Study Modules', value: '12 / 15', icon: GraduationCap, color: 'text-orange-600', bg: 'bg-orange-100' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon size={24} className={stat.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Class */}
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 text-xs font-bold uppercase tracking-wider">
                    Next Session Starts in 2 Hours
                  </div>
                  <h3 className="text-2xl font-bold">Mathematics - Class 10</h3>
                  <p className="text-primary-foreground/70">Topic: Trigonometry & Identities (Part 2)</p>
                  <div className="flex items-center gap-4 text-sm mt-4">
                    <div className="flex items-center gap-1.5"><Clock size={16} /> 04:30 PM - 06:00 PM</div>
                    <div className="flex items-center gap-1.5"><Calendar size={16} /> Today, 29 Apr</div>
                  </div>
                </div>
                <Button className="bg-white text-primary hover:bg-white/90 font-bold px-8" size="lg">
                  Join Room
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Performance</CardTitle>
              <CardDescription>Your weekly attendance trend this month</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Recent Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Notes</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">All Notes</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Trigonometry Formulary', type: 'PDF', size: '2.4 MB', date: 'Yesterday' },
                { title: 'JEE 2026 Strategy', type: 'PDF', size: '1.1 MB', date: '2 days ago' },
                { title: 'Physics Numericals', type: 'DOCX', size: '4.8 MB', date: '3 days ago' },
              ].map((note, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border group hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <BookOpen size={20} className="text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[150px]">{note.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{note.type} • {note.size}</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-orange-50 border-l-4 border-orange-500">
                <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">New Update</p>
                <p className="text-sm font-medium text-orange-900">May Batch registrations are now open. Refer your friends for ₹500 discount.</p>
                <p className="text-[10px] text-orange-700/60 mt-2 font-bold uppercase">Today, 10:00 AM</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Schedule Change</p>
                <p className="text-sm font-medium">Tomorrow&apos;s Science class will start at 5:00 PM instead of 4:00 PM.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2 font-bold uppercase">Yesterday</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
