import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightToBracket, faMagnifyingGlass, faCheckCircle,
  faShieldHalved, faChalkboard, faIndianRupeeSign,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface BatchInfo {
  id: string;
  name: string;
  subject: string | null;
  type: string | null;
  monthly_fee: number | null;
  teacher_name: string;
}

type Step = 'enter' | 'confirm' | 'done';

export default function JoinPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('enter');
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);

  async function searchBatch() {
    if (code.trim().length < 6) { toast.error('Enter a valid 6-character code'); return; }
    setSearching(true);
    setBatchInfo(null);
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`id, name, subject, type, monthly_fee,
          teacher:teacher_profiles(profile:profiles(full_name))`)
        .eq('invite_code', code.trim().toUpperCase())
        .single();
      if (error || !data) throw new Error('Batch not found. Check the code and try again.');
      setBatchInfo({
        id: data.id,
        name: data.name,
        subject: data.subject,
        type: data.type,
        monthly_fee: data.monthly_fee,
        teacher_name: (data.teacher as any)?.profile?.full_name || 'Teacher',
      });
      setStep('confirm');
    } catch (e: any) { toast.error(e.message); }
    finally { setSearching(false); }
  }

  async function joinBatch() {
    if (!batchInfo) return;
    setJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
      if (!student) throw new Error('Student profile not found. Please complete onboarding first.');

      const { error } = await supabase.from('enrollments').insert({
        student_id: student.id,
        batch_id: batchInfo.id,
        status: 'ACTIVE',
      });
      if (error) {
        if (error.code === '23505') throw new Error('You are already enrolled in this batch.');
        throw error;
      }
      setStep('done');
    } catch (e: any) { toast.error(e.message); }
    finally { setJoining(false); }
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Join a Batch</h2>
        <p className="text-sm text-slate-500 mt-1">Enter the 6-character invite code from your teacher</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {(['enter', 'confirm', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s ? 'bg-indigo-600 text-white'
                : (step === 'confirm' && s === 'enter') || step === 'done' ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
            }`}>
              {((step === 'confirm' && s === 'enter') || step === 'done') && s !== 'done' ? (
                <FontAwesomeIcon icon={faCheckCircle} />
              ) : i + 1}
            </div>
            {i < 2 && <div className={`w-8 h-0.5 ${step !== 'enter' && i === 0 ? 'bg-emerald-400' : step === 'done' && i === 1 ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        {step === 'enter' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Invite Code</label>
              <div className="flex gap-3">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && searchBatch()}
                  className="flex-1 px-4 py-3 text-center text-xl font-mono font-bold tracking-widest rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  placeholder="AB1234"
                  maxLength={6}
                />
              </div>
            </div>
            <button
              onClick={searchBatch}
              disabled={searching || code.trim().length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-60">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              {searching ? 'Searching...' : 'Find Batch'}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <FontAwesomeIcon icon={faShieldHalved} />
              Only join batches from teachers you know and trust.
            </div>
          </div>
        )}

        {step === 'confirm' && batchInfo && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 dark:text-emerald-400 text-xl shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Batch found!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Review the details below before joining.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                  {batchInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{batchInfo.name}</p>
                  <p className="text-xs text-slate-500">{batchInfo.teacher_name}{batchInfo.subject ? ` · ${batchInfo.subject}` : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <FontAwesomeIcon icon={faChalkboard} className="text-xs" /> Batch Type
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{batchInfo.type || 'Regular'}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="text-xs" /> Monthly Fee
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {batchInfo.monthly_fee ? `₹${batchInfo.monthly_fee.toLocaleString('en-IN')}` : 'Free'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep('enter'); setBatchInfo(null); }}
                className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors">
                Back
              </button>
              <button onClick={joinBatch} disabled={joining}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer disabled:opacity-60 transition-colors">
                {joining ? 'Joining...' : 'Confirm & Join'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl mx-auto">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">You're enrolled!</h3>
              <p className="text-sm text-slate-500 mt-1">
                You've successfully joined <strong>{batchInfo?.name}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/student/batches')}
                className="flex-1 py-2.5 text-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                My Batches
              </button>
              <button onClick={() => navigate('/student/dashboard')}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors">
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
