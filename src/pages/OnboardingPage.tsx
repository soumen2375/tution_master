import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Users, User, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Role = 'TEACHER' | 'STUDENT';

type Step =
  | 'role'
  | 'teacher_1'
  | 'teacher_2'
  | 'student_1'
  | 'student_2'
  | 'join_batch'
  | 'done';

interface FormData {
  full_name: string;
  phone: string;
  institution: string;
  class: string;
  guardian_name: string;
  guardian_phone: string;
  subjects: string;
  bio: string;
  invite_code: string;
}

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Hindi', 'Social Science', 'Computer Science', 'Economics', 'History',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>({
    full_name: '', phone: '', institution: '', class: '',
    guardian_name: '', guardian_phone: '', subjects: '', bio: '',
    invite_code: '',
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);
      setForm(f => ({ ...f, full_name: user.user_metadata?.full_name || '' }));

      // Check if already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'TEACHER') { navigate('/teacher/dashboard'); return; }
      if (profile?.role === 'STUDENT') { navigate('/student/dashboard'); return; }
    }
    init();
  }, [navigate]);

  const update = (field: keyof FormData, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const toggleSubject = (s: string) =>
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep(r === 'TEACHER' ? 'teacher_1' : 'student_1');
  };

  const submitTeacher = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step A: Upsert profile (ensure row exists with correct role)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.full_name || user.user_metadata?.full_name || user.email,
        phone: form.phone || null,
        role: 'TEACHER',
      }, { onConflict: 'id' });
      if (profileError) throw new Error(`Profile error: ${profileError.message}`);

      // Step B: Upsert teacher_profile
      const { error: teacherError } = await supabase.from('teacher_profiles').upsert({
        user_id: user.id,
        bio: form.bio || null,
        subjects: selectedSubjects,
        institution: form.institution || null,
      }, { onConflict: 'user_id' });
      if (teacherError) throw new Error(`Teacher profile error: ${teacherError.message}`);

      toast.success('Welcome to TutionHut! Your teacher account is ready. 🎉');
      navigate('/teacher/dashboard');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitStudent = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step A: Upsert profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.full_name || user.user_metadata?.full_name || user.email,
        phone: form.phone || null,
        role: 'STUDENT',
      }, { onConflict: 'id' });
      if (profileError) throw new Error(`Profile error: ${profileError.message}`);

      // Step B: Upsert student_profile
      const { error: studentError } = await supabase.from('student_profiles').upsert({
        user_id: user.id,
        guardian_name: form.guardian_name || null,
        guardian_phone: form.guardian_phone || null,
        institution: form.institution || null,
        class_name: form.class || null,
      }, { onConflict: 'user_id' });
      if (studentError) throw new Error(`Student profile error: ${studentError.message}`);

      if (form.invite_code) {
        setStep('join_batch');
        setLoading(false);
        return;
      }

      toast.success('Welcome to TutionHut! 🎓');
      navigate('/student/dashboard');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Setup failed. Please try again.');
      setLoading(false);
    }
  };

  const joinBatch = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!student) throw new Error('Student profile not found');

      const { data: batch } = await supabase
        .from('batches')
        .select('id, name')
        .eq('invite_code', form.invite_code.toUpperCase())
        .single();
      if (!batch) throw new Error('Batch not found');

      await supabase.from('enrollments').insert({
        student_id: student.id,
        batch_id: batch.id,
      });

      toast.success(`Joined "${batch.name}" successfully!`);
      navigate('/student/dashboard');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to join batch');
    } finally {
      setLoading(false);
    }
  };

  // ── Steps ──────────────────────────────────────────────────────────────────
  const stepProgress: Record<Step, number> = {
    role: 0, teacher_1: 1, teacher_2: 2, student_1: 1, student_2: 2,
    join_batch: 3, done: 4,
  };

  const totalSteps = role === 'TEACHER' ? 2 : 3;
  const currentStep = stepProgress[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--background)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-2 rounded-xl shadow-lg">
          <GraduationCap size={28} />
        </div>
        <span className="text-2xl font-bold tracking-tight">TutionHut</span>
      </div>

      {/* Progress dots */}
      {step !== 'role' && (
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn(
              'h-2 rounded-full transition-all duration-300',
              i < currentStep ? 'w-8 bg-primary' : i === currentStep - 1 ? 'w-8 bg-primary' : 'w-2 bg-border'
            )} />
          ))}
        </div>
      )}

      <div className="w-full max-w-lg">

        {/* ── Step: Role Selection ── */}
        {step === 'role' && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">How will you use TutionHut?</h1>
              <p className="text-muted-foreground">Choose your role to get started. You cannot change this later.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { r: 'TEACHER' as Role, icon: Users, title: "I'm a Teacher", desc: "Manage batches, attendance, fees, and share study materials with your students." },
                { r: 'STUDENT' as Role, icon: User, title: "I'm a Student", desc: "Access your class notes, attendance record, and track your fee payments." },
              ].map(({ r, icon: Icon, title, desc }) => (
                <button
                  key={r}
                  onClick={() => handleRoleSelect(r)}
                  className="group p-6 rounded-2xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
                  style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all text-primary">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Select <ArrowRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Teacher Step 1: Basic Info ── */}
        {step === 'teacher_1' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Tell us about yourself</h2>
              <p className="text-muted-foreground mt-1">Basic info to set up your teacher profile</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name *</label>
                <Input placeholder="e.g. Rahul Kumar" value={form.full_name}
                  onChange={e => update('full_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phone Number *</label>
                <Input placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => update('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Institution / Centre Name</label>
                <Input placeholder="e.g. Bright Future Coaching" value={form.institution}
                  onChange={e => update('institution', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('role')}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep('teacher_2')}
                disabled={!form.full_name.trim()}>
                Continue <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Teacher Step 2: Subjects & Bio ── */}
        {step === 'teacher_2' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">What do you teach?</h2>
              <p className="text-muted-foreground mt-1">Select all subjects you teach</p>
            </div>
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
                  {selectedSubjects.includes(s) && <Check size={12} className="inline mr-1" />}
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Short Bio (optional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Tell students about your experience and teaching style..."
                value={form.bio}
                onChange={e => update('bio', e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('teacher_1')}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button className="flex-1" onClick={submitTeacher} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Start Teaching <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Student Step 1: Basic Info ── */}
        {step === 'student_1' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Your student profile</h2>
              <p className="text-muted-foreground mt-1">Let your teacher know who you are</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name *</label>
                <Input placeholder="e.g. Priya Sharma" value={form.full_name}
                  onChange={e => update('full_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phone Number</label>
                <Input placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => update('phone', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Class / Standard</label>
                  <Input placeholder="e.g. Class 10" value={form.class}
                    onChange={e => update('class', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">School / College</label>
                  <Input placeholder="e.g. DPS School" value={form.institution}
                    onChange={e => update('institution', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('role')}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep('student_2')}
                disabled={!form.full_name.trim()}>
                Continue <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Student Step 2: Guardian + Invite ── */}
        {step === 'student_2' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Guardian &amp; Batch Info</h2>
              <p className="text-muted-foreground mt-1">Almost done! Add guardian info and join your batch.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Guardian Name</label>
                <Input placeholder="e.g. Rajesh Sharma (Father)" value={form.guardian_name}
                  onChange={e => update('guardian_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Guardian Phone</label>
                <Input placeholder="+91 98765 43210" value={form.guardian_phone}
                  onChange={e => update('guardian_phone', e.target.value)} />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-semibold">Batch Invite Code (optional)</label>
                <Input
                  placeholder="e.g. AB12CD"
                  className="font-mono tracking-widest text-center text-lg uppercase"
                  value={form.invite_code}
                  onChange={e => update('invite_code', e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your teacher for this code. You can also join a batch later from your dashboard.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('student_1')}>
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button className="flex-1" onClick={submitStudent} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {form.invite_code ? 'Next' : 'Finish Setup'} <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Join Batch ── */}
        {step === 'join_batch' && (
          <div className="space-y-6 text-center">
            <div>
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} />
              </div>
              <h2 className="text-2xl font-bold">Join Your Batch</h2>
              <p className="text-muted-foreground mt-1">
                Joining batch with code <span className="font-mono font-bold text-primary">{form.invite_code}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { navigate('/student/dashboard'); }}>
                Skip for now
              </Button>
              <Button className="flex-1" onClick={joinBatch} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Join Batch
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
