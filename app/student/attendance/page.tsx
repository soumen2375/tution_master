'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

export default function StudentAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const stats = [
    { label: 'Present', value: '14', color: 'text-green-600', icon: CheckCircle2 },
    { label: 'Absent', value: '1', color: 'text-red-600', icon: XCircle },
    { label: 'Late', value: '2', color: 'text-orange-600', icon: Clock },
  ];

  const sessions = [
    { date: '2026-04-28', status: 'PRESENT', batch: 'Class 10 Math', topic: 'Trigonometry' },
    { date: '2026-04-26', status: 'LATE', batch: 'Class 10 Math', topic: 'Algebra Basics' },
    { date: '2026-04-24', status: 'PRESENT', batch: 'Class 10 Math', topic: 'Polynomials' },
    { date: '2026-04-21', status: 'ABSENT', batch: 'Class 10 Math', topic: 'Geometry' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Attendance</h2>
          <p className="text-muted-foreground">Keep an eye on your consistency and punctuality.</p>
        </div>
        <div className="flex bg-white rounded-lg border p-1 shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
            <ChevronLeft size={16} />
          </Button>
          <div className="px-4 py-1.5 text-sm font-bold uppercase tracking-widest min-w-[140px] text-center">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm shadow-primary/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={cn("text-4xl font-black", stat.color)}>{stat.value}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl">
                <stat.icon size={28} className={stat.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* History Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detailed History</CardTitle>
            <CardDescription>A list of all sessions and your attendance status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border group hover:border-primary transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-bold uppercase",
                      session.status === 'PRESENT' && "bg-green-50 text-green-700 border-green-100",
                      session.status === 'ABSENT' && "bg-red-50 text-red-700 border-red-100",
                      session.status === 'LATE' && "bg-orange-50 text-orange-700 border-orange-100",
                    )}>
                      <span className="text-[10px]">{formatDate(session.date).split(' ')[1]}</span>
                      <span className="text-xl leading-none">{session.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{session.batch}</h4>
                      <p className="text-xs text-muted-foreground italic">{session.topic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      session.status === 'PRESENT' && "bg-green-100 text-green-700",
                      session.status === 'ABSENT' && "bg-red-100 text-red-700",
                      session.status === 'LATE' && "bg-orange-100 text-orange-700",
                    )}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Analytics */}
        <div className="space-y-8">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Consistency Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-10">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-white/10 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                  <circle 
                    className="text-white stroke-current" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    fill="transparent" 
                    r="40" 
                    cx="50" 
                    cy="50" 
                    strokeDasharray="251.2" 
                    strokeDashoffset="37.6" // 85%
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-3xl italic">85%</div>
              </div>
              <p className="text-sm text-primary-foreground/80 font-medium">You are more consistent than 78% of your batchmates. Keep it up!</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertCircle size={20} className="text-orange-600" />
              <CardTitle className="text-lg text-orange-900 dark:text-orange-100">Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                You were marked <strong>Absent</strong> on 21 April. If this is an error, please contact your teacher within 24 hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
