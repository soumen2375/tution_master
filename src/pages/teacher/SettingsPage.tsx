import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faBookOpen, faIdCard, faCopy, faCheck,
  faFloppyDisk, faGraduationCap,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Hindi', 'Social Science', 'Computer Science', 'Economics', 'History',
];

const settingsSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  phone: z.string().optional(),
  institution: z.string().optional(),
  bio: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('FREE');
  const [authEmail, setAuthEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });
  const watchedName = watch('full_name', displayName);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthEmail(user.email || '');

      const [{ data: profile }, { data: teacher }] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('teacher_profiles').select('id, bio, institution, subjects, plan').eq('user_id', user.id).single(),
      ]);

      if (profile) {
        setDisplayName(profile.full_name || '');
        reset({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          institution: (teacher as any)?.institution || '',
          bio: (teacher as any)?.bio || '',
        });
      }
      if (teacher) {
        setTeacherId((teacher as any).id);
        setPlan((teacher as any).plan || 'FREE');
        setSelectedSubjects((teacher as any).subjects || []);
      }
      setLoading(false);
    }
    load();
  }, [reset]);

  function toggleSubject(s: string) {
    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function onSave(data: SettingsForm) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await Promise.all([
        supabase.from('profiles').update({ full_name: data.full_name, phone: data.phone || null }).eq('id', user.id),
        supabase.from('teacher_profiles').update({
          bio: data.bio || null,
          institution: data.institution || null,
          subjects: selectedSubjects,
        }).eq('user_id', user.id),
      ]);
      setDisplayName(data.full_name);
      toast.success('Settings saved');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  function copyTeacherId() {
    if (teacherId) {
      navigator.clipboard.writeText(`TCH-${teacherId.slice(0, 8).toUpperCase()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const avatarInitial = (watchedName || displayName || 'T').charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl skeleton" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Teacher ID card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">
              <FontAwesomeIcon icon={faIdCard} />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Your Teacher ID</p>
              <p className="text-lg font-mono font-bold text-indigo-900 dark:text-indigo-100">
                {teacherId ? `TCH-${teacherId.slice(0, 8).toUpperCase()}` : '—'}
              </p>
            </div>
          </div>
          <button onClick={copyTeacherId}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Share this ID with students so they can find and join your batches.</p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <FontAwesomeIcon icon={faUser} className="text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Profile Information</h3>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {avatarInitial}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{authEmail}</p>
            <p className="text-xs text-slate-500 mt-0.5">Email cannot be changed here</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input {...register('full_name')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Phone</label>
              <input {...register('phone')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Institution</label>
            <input {...register('institution')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Bright Future Coaching Centre" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea {...register('bio')} rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Tell students about your experience..." />
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faBookOpen} className="text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Subjects I Teach</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => toggleSubject(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                selectedSubjects.includes(s)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              {s}
            </button>
          ))}
        </div>
        {selectedSubjects.length === 0 && <p className="text-xs text-slate-400 mt-2">Select subjects you teach</p>}
      </div>

      {/* Plan */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faGraduationCap} className="text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Current Plan</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{plan}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {plan === 'FREE' ? 'Up to 30 students · 1 batch · No file storage' : 'Unlimited students · Unlimited batches · 2GB storage'}
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold rounded-full">Active</span>
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSubmit(onSave)} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-60">
        <FontAwesomeIcon icon={faFloppyDisk} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
