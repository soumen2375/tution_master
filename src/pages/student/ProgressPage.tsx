import { useState, useEffect } from 'react';
import { TrendingUp, Star, BookOpen, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentProgress } from '@/lib/api/progress';
import { getStudentAttendance } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ProgressRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StudentProgressPage() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({ totalSessions: 0, totalPresent: 0, avgAttendance: 0 });

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudentProgress();
        setRecords(data);

        if (data.length > 0) {
          const totalSessions = data.reduce((s, r) => s + r.total_sessions, 0);
          const totalPresent = data.reduce((s, r) => s + r.present_count, 0);
          const avgAttendance = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;
          setOverallStats({ totalSessions, totalPresent, avgAttendance: Math.round(avgAttendance) });
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Prepare chart data (last 6 months)
  const chartData = [...records]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(r => ({
      month: `${MONTH_NAMES[r.month - 1]} ${r.year}`,
      attendance: r.attendance_pct,
      examScore: r.exam_score && r.exam_total ? Math.round((r.exam_score / r.exam_total) * 100) : null,
    }));

  const getAttendanceColor = (pct: number) =>
    pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500';

  const getStars = (rating: number | null) =>
    rating ? Array.from({ length: 5 }, (_, i) => i < rating ? '★' : '☆').join('') : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Progress</h2>
        <p className="text-muted-foreground">Track your attendance, scores, and growth over time</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard label="Total Sessions Attended" value={overallStats.totalPresent}
          icon={Calendar} iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-50 dark:bg-blue-950" />
        <StatCard label="Overall Attendance" value={`${overallStats.avgAttendance}%`}
          icon={TrendingUp}
          iconColor={overallStats.avgAttendance >= 80 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}
          iconBg={overallStats.avgAttendance >= 80 ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'} />
        <StatCard label="Months Tracked" value={records.length}
          icon={BookOpen} iconColor="text-purple-600 dark:text-purple-400" iconBg="bg-purple-50 dark:bg-purple-950" />
      </div>

      {/* Attendance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Attendance Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: unknown, name: string | number) => [
                    `${value}${name === 'attendance' ? '%' : ' pts'}`,
                    name === 'attendance' ? 'Attendance' : 'Exam Score'
                  ]) as any}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}
                />
                <Line
                  type="monotone" dataKey="attendance"
                  stroke="hsl(340, 82%, 52%)" strokeWidth={3} dot={{ r: 5, fill: 'hsl(340, 82%, 52%)' }}
                />
                {chartData.some(d => d.examScore !== null) && (
                  <Line
                    type="monotone" dataKey="examScore"
                    stroke="hsl(210, 80%, 55%)" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Cards */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse italic">Loading progress...</div>
      ) : records.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Monthly Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {records.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{MONTH_NAMES[r.month - 1]} {r.year}</h4>
                      {r.teacher_rating && (
                        <p className="text-amber-500 text-lg tracking-widest">{getStars(r.teacher_rating)}</p>
                      )}
                    </div>
                    <div className={cn('text-3xl font-black', getAttendanceColor(r.attendance_pct))}>
                      {r.attendance_pct}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Attendance bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1 font-medium">
                        <span>Attendance</span>
                        <span>{r.present_count} / {r.total_sessions} sessions</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', r.attendance_pct >= 80 ? 'bg-green-500' : r.attendance_pct >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${r.attendance_pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Exam score */}
                    {r.exam_score !== null && r.exam_total && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award size={14} className="text-blue-600 shrink-0" />
                        <span className="text-muted-foreground">Exam Score:</span>
                        <span className="font-bold text-blue-600">
                          {r.exam_score} / {r.exam_total} ({Math.round((r.exam_score / r.exam_total) * 100)}%)
                        </span>
                      </div>
                    )}

                    {/* Teacher note */}
                    {r.performance_note && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                        <p className="text-xs font-bold text-primary mb-1">📝 Teacher's Note</p>
                        <p className="text-xs text-muted-foreground italic">"{r.performance_note}"</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <TrendingUp size={48} className="text-muted-foreground opacity-30" />
            <div>
              <h3 className="text-xl font-bold">No progress data yet</h3>
              <p className="text-muted-foreground mt-1">
                Your teacher will update your monthly progress after classes begin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
