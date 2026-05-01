import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faFloppyDisk, faGraduationCap, faIdCard, faCopy, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

const settingsSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  phone: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export default function StudentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });
  const watchedName = watch('full_name', displayName);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthEmail(user.email || '');

      const [profileRes, spRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('student_profiles').select('student_code').eq('user_id', user.id).maybeSingle(),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.full_name || '');
        reset({
          full_name: profileRes.data.full_name || '',
          phone: profileRes.data.phone || '',
        });
      }
      if (spRes.data?.student_code) setStudentCode(spRes.data.student_code);
      setLoading(false);
    }
    load();
  }, [reset]);

  function copyCode() {
    if (!studentCode) return;
    navigator.clipboard.writeText(studentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onSave(data: SettingsForm) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name, phone: data.phone || null })
        .eq('id', user.id);
      if (error) throw error;
      setDisplayName(data.full_name);
      toast.success('Settings saved');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  const avatarInitial = (watchedName || displayName || 'S').charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {[1, 2].map(i => <div key={i} className="h-40 rounded-xl skeleton" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile information</p>
      </div>

      {/* Student ID card */}
      {studentCode && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">
                <FontAwesomeIcon icon={faIdCard} />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Your Student ID</p>
                <p className="text-lg font-mono font-bold text-indigo-900 dark:text-indigo-100">{studentCode}</p>
              </div>
            </div>
            <button onClick={copyCode}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Share this ID with your teacher so they can directly enroll you in a batch.</p>
        </div>
      )}

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
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input {...register('full_name')}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100" />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Phone</label>
            <input {...register('phone')}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              placeholder="+91 98765 43210" />
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faGraduationCap} className="text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Account</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-slate-500">Role</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Student</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-500">Email</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{authEmail}</span>
          </div>
        </div>
      </div>

      <button onClick={handleSubmit(onSave)} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-60">
        <FontAwesomeIcon icon={faFloppyDisk} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
