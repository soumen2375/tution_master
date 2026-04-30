import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Camera, Loader2, Save, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile, TeacherProfile } from '@/lib/types';
import { PLAN_LIMITS } from '@/lib/types';
import { cn } from '@/lib/utils';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Hindi', 'Social Science', 'Computer Science', 'Economics', 'History',
];

export default function TeacherSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [form, setForm] = useState({
    full_name: '', phone: '', bio: '', institution: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthEmail(user.email ?? '');

      const [{ data: p }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('teacher_profiles').select('*').eq('user_id', user.id).single(),
      ]);

      if (p) {
        setProfile(p as Profile);
        setForm({
          full_name: p.full_name ?? '',
          phone: p.phone ?? '',
          bio: (t as TeacherProfile | null)?.bio ?? '',
          institution: (t as TeacherProfile | null)?.institution ?? '',
        });
      }
      if (t) {
        setTeacher(t as TeacherProfile);
        setSelectedSubjects((t as TeacherProfile).subjects ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggleSubject = (s: string) =>
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await Promise.all([
        supabase.from('profiles').update({
          full_name: form.full_name,
          phone: form.phone,
        }).eq('id', user.id),
        supabase.from('teacher_profiles').update({
          bio: form.bio || null,
          institution: form.institution || null,
          subjects: selectedSubjects,
        }).eq('user_id', user.id),
      ]);

      toast.success('Profile updated successfully!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground animate-pulse italic">Loading settings...</div>;

  const planLimits = PLAN_LIMITS[teacher?.plan ?? 'FREE'];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20">
              {form.full_name?.charAt(0) ?? <User size={32} />}
            </div>
            <div>
              <p className="font-bold text-sm">{form.full_name}</p>
              <p className="text-xs text-muted-foreground">{authEmail}</p>
              <Button variant="outline" size="sm" className="mt-2 h-8 text-xs" disabled>
                <Camera size={12} className="mr-1" /> Change Photo (coming soon)
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Full Name</label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Phone</label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Institution / Coaching Centre</label>
            <Input placeholder="e.g. Bright Future Coaching Centre"
              value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bio</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Tell students about your experience..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen size={18} /> Subjects I Teach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => toggleSubject(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  selectedSubjects.includes(s)
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'border-border hover:border-primary hover:text-primary'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap size={18} /> Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black">{teacher?.plan ?? 'FREE'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Up to {planLimits.students} students • {planLimits.batches} {planLimits.batches === 1 ? 'batch' : 'batches'} •{' '}
                {planLimits.storageMb === 0 ? 'No file storage' : `${planLimits.storageMb / 1024}GB storage`}
              </p>
              <p className={cn(
                'text-xs font-bold mt-1 uppercase',
                teacher?.subscription_status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'
              )}>
                ● {teacher?.subscription_status ?? 'TRIAL'}
              </p>
            </div>
            <Button variant="outline" disabled>Manage Plan (coming soon)</Button>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full shadow-lg" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}
