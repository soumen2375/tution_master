'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Calendar, 
  IndianRupee, 
  BookOpen, 
  Bell, 
  Settings, 
  ArrowLeft,
  Copy,
  Check,
  MoreVertical,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function BatchDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = params.id as string;
  const activeTab = searchParams.get('tab') || 'overview';

  const [batch, setBatch] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBatchDetails() {
      setLoading(true);
      const { data: batchData } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (batchData) {
        setBatch(batchData);
        
        // Fetch students
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*, student:student_profiles(id, profiles(full_name, avatar_url))')
          .eq('batch_id', batchId);
        
        setStudents(enrollments || []);

        // Fetch sessions
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('*')
          .eq('batch_id', batchId)
          .order('date', { ascending: false });
        
        setSessions(sessionData || []);
      }
      setLoading(false);
    }
    fetchBatchDetails();
  }, [batchId]);

  const copyCode = () => {
    navigator.clipboard.writeText(batch.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'fees', label: 'Fees', icon: IndianRupee },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
  if (!batch) return <div>Batch not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teacher/batches')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{batch.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="font-medium uppercase tracking-wide">{batch.subject}</span>
              <span>•</span>
              <span className="capitalize">{batch.type.toLowerCase()}</span>
            </div>
          </div>
        </div>

        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="py-2 px-4 flex items-center gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Invite Code</p>
              <p className="font-mono font-bold tracking-widest text-lg">{batch.invite_code}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyCode}>
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className="shrink-0"
            onClick={() => router.push(`?tab=${tab.id}`)}
          >
            <tab.icon size={16} className="mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <BatchOverview batch={batch} students={students} sessions={sessions} />}
        {activeTab === 'students' && <BatchStudents students={students} batchId={batchId} />}
        {activeTab === 'attendance' && <BatchAttendance sessions={sessions} students={students} batchId={batchId} />}
      </div>
    </div>
  );
}

// Sub-components

function BatchOverview({ batch, students, sessions }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>About the Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {batch.description || "No description provided for this batch."}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Fee</p>
              <p className="font-bold">{formatCurrency(batch.monthly_fee)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Students</p>
              <p className="font-bold">{students.length} / {batch.max_students}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</p>
              <p className="font-bold">{formatDate(batch.start_date)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
              <p className="font-bold text-green-600">{batch.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {batch.schedule.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/10">
              <span className="font-bold text-sm tracking-wide uppercase">{item.day}</span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Clock size={12} /> {item.startTime} - {item.endTime}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Class Log</CardTitle>
            <CardDescription>Recent sessions held for this batch</CardDescription>
          </div>
          <Button variant="outline" size="sm">View Full History</Button>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border group hover:border-primary transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex flex-col items-center justify-center border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-[10px] uppercase font-bold">{session.date.split('-')[1]}</span>
                      <span className="text-xl font-black">{session.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold">{session.title || "Subject Session"}</h4>
                      <p className="text-xs text-muted-foreground">{session.topic || "Regular class topic"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Attendance</p>
                      <p className="text-sm font-bold">10 / 12</p>
                    </div>
                    <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              No sessions documented yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BatchStudents({ students, batchId }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>{students.length} students currently in this batch</CardDescription>
        </div>
        <Button variant="outline"><Plus className="mr-2" size={16} /> Add Manually</Button>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 px-4">Enrolled On</th>
                  <th className="pb-3 px-4">Attendance</th>
                  <th className="pb-3 px-4">Fee Status</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((e: any) => (
                  <tr key={e.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {e.student.profiles.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{e.student.profiles.full_name}</p>
                          <p className="text-xs text-muted-foreground italic">Class 10</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{formatDate(e.enrolled_at)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[85%]" />
                        </div>
                        <span className="text-xs font-bold font-mono italic">85%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase">Paid</span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">Share the invite code to enroll students.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BatchAttendance({ sessions, students, batchId }: any) {
  const [marking, setMarking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});

  const markAllPresent = () => {
    const newAtt: any = {};
    students.forEach((s: any) => {
      newAtt[s.student.id] = 'PRESENT';
    });
    setAttendance(newAtt);
  };

  const submitAttendance = async () => {
    setMarking(true);
    try {
      // 1. Create Session
      const { data: session, error: sError } = await supabase
        .from('sessions')
        .insert({
          batch_id: batchId,
          date: selectedDate,
          start_time: '08:00', // Mock for now
          end_time: '09:30',
        })
        .select()
        .single();
      
      if (sError) throw sError;

      // 2. Create Attendance Records
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        session_id: session.id,
        student_id: studentId,
        status: status,
      }));

      const { error: aError } = await supabase
        .from('attendance')
        .insert(records);
      
      if (aError) throw aError;

      toast.success('Attendance submitted successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mark New Attendance</CardTitle>
            <CardDescription>Select a date and mark students</CardDescription>
          </div>
          <Input 
            type="date" 
            className="w-48" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={markAllPresent}>Mark All Present</Button>
          </div>
          <div className="divide-y border rounded-xl overflow-hidden shadow-sm">
            {students.length > 0 ? students.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-4 bg-white hover:bg-secondary/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                    {e.student.profiles.full_name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm tracking-tight">{e.student.profiles.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant={attendance[e.student.id] === 'PRESENT' ? 'default' : 'outline'}
                    className={cn(attendance[e.student.id] === 'PRESENT' && "bg-green-600 hover:bg-green-700")}
                    onClick={() => setAttendance({...attendance, [e.student.id]: 'PRESENT'})}
                  >
                    <CheckCircle2 size={16} className="mr-1.5" /> Present
                  </Button>
                  <Button 
                    size="sm" 
                    variant={attendance[e.student.id] === 'ABSENT' ? 'default' : 'outline'}
                    className={cn(attendance[e.student.id] === 'ABSENT' && "bg-red-600 hover:bg-red-700")}
                    onClick={() => setAttendance({...attendance, [e.student.id]: 'ABSENT'})}
                  >
                    <XCircle size={16} className="mr-1.5" /> Absent
                  </Button>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-muted-foreground italic font-serif">No students to mark.</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/20 justify-end py-4">
          <Button disabled={marking || Object.keys(attendance).length === 0} onClick={submitAttendance}>
            {marking ? <Loader2 className="animate-spin mr-2" /> : 'Save Attendance'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

import { LayoutDashboard } from "lucide-react";
