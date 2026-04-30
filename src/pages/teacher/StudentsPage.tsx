import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, User, Calendar, IndianRupee, MoreVertical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getAllTeacherStudents } from '@/lib/api/students';
import type { Enrollment } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllTeacherStudents()
      .then(setEnrollments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Deduplicate by student (one row per student, list their batches)
  const studentMap = new Map<string, { enrollment: Enrollment; batches: string[] }>();
  enrollments.forEach(e => {
    const sid = e.student_id;
    const entry = studentMap.get(sid);
    const batchName = (e.batch as { name: string } | undefined)?.name ?? '';
    if (entry) {
      entry.batches.push(batchName);
    } else {
      studentMap.set(sid, { enrollment: e, batches: [batchName] });
    }
  });
  const students = Array.from(studentMap.values());

  const filtered = students.filter(s => {
    const name = (s.enrollment.student as { profile: { full_name: string } } | undefined)?.profile?.full_name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Students</h2>
          <p className="text-muted-foreground">{students.length} students across all your batches</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Search by student name..." className="pl-10"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline"><Filter size={18} className="mr-2" /> Filter</Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground italic animate-pulse">Loading students...</div>
      ) : filtered.length > 0 ? (
        <div className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--card-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--feature-card-bg)' }}>
                  <th className="p-4">Student</th>
                  <th className="p-4">Batches</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Guardian</th>
                  <th className="p-4">Enrolled</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                {filtered.map(({ enrollment: e, batches }) => {
                  const student = e.student as { id: string; class_name?: string; guardian_name?: string; profile: { full_name: string; phone?: string; avatar_url?: string } } | undefined;
                  const profile = student?.profile;
                  return (
                    <tr key={e.student_id} className="group hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                            {profile?.full_name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{profile?.full_name ?? 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground">{student?.class_name ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {batches.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{profile?.phone ?? '—'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{student?.guardian_name ?? '—'}</td>
                      <td className="p-4 text-xs text-muted-foreground font-mono">
                        {new Date(e.enrolled_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4 text-right">
                        <Link to={`/teacher/students/${e.student_id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <Users size={48} className="text-muted-foreground opacity-30" />
            <div>
              <h3 className="text-xl font-bold">No students yet</h3>
              <p className="text-muted-foreground mt-1">
                Share your batch invite codes with students to get started.
              </p>
            </div>
            <Link to="/teacher/batches">
              <Button variant="outline">Go to Batches</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
