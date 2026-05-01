import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightToBracket, faMagnifyingGlass, faCheckCircle,
  faShieldHalved, faChalkboard, faIndianRupeeSign, faUser,
  faChevronRight, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

interface TeacherInfo {
  id: string;
  teacher_code: string;
  full_name: string;
}

interface BatchOption {
  id: string;
  name: string;
  subject: string | null;
  type: string | null;
  monthly_fee: number | null;
  schedule: any[];
}

type Step = 'enter' | 'pick' | 'confirm' | 'done';

export default function JoinPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('enter');
  const [teacherId, setTeacherId] = useState('');
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchOption | null>(null);

  const STEPS: Step[] = ['enter', 'pick', 'confirm', 'done'];
  const stepLabels = ['Find Teacher', 'Pick Batch', 'Confirm', 'Done'];

  async function searchTeacher() {
    const code = teacherId.trim().toUpperCase();
    if (!code.startsWith('TCH-') || code.length < 8) {
      toast.error('Enter a valid Teacher ID (e.g. TCH-A1B2C3D4)');
      return;
    }
    setSearching(true);
    try {
      const { data: tp, error } = await supabase
        .from('teacher_profiles')
        .select('id, teacher_code, profile:profiles(full_name)')
        .eq('teacher_code', code)
        .maybeSingle();

      if (error) throw error;
      if (!tp) throw new Error('No teacher found with that ID. Check and try again.');

      const { data: batchData, error: bErr } = await supabase
        .from('batches')
        .select('id, name, subject, type, monthly_fee, schedule')
        .eq('teacher_id', tp.id)
        .eq('status', 'ACTIVE');

      if (bErr) throw bErr;

      setTeacher({ id: tp.id, teacher_code: (tp as any).teacher_code, full_name: (tp as any).profile?.full_name || 'Teacher' });
      setBatches(batchData || []);
      setStep('pick');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSearching(false);
    }
  }

  function pickBatch(batch: BatchOption) {
    setSelectedBatch(batch);
    setStep('confirm');
  }

  async function joinBatch() {
    if (!selectedBatch) return;
    setJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!student) throw new Error('Complete your onboarding before joining a batch.');

      const { error } = await supabase.from('enrollments').insert({
        student_id: student.id,
        batch_id: selectedBatch.id,
        status: 'ACTIVE',
      });

      if (error) {
        if (error.code === '23505') throw new Error('You are already enrolled in this batch.');
        throw error;
      }
      setStep('done');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  }

  function reset() {
    setStep('enter');
    setTeacherId('');
    setTeacher(null);
    setBatches([]);
    setSelectedBatch(null);
  }

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <FontAwesomeIcon icon={faArrowRightToBracket} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Join a Batch</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your teacher's unique ID to browse and join their batches</p>
      </div>

      {/* Step indicators */}
      {step !== 'done' && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.slice(0, 3).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < currentStepIndex ? 'bg-emerald-500 text-white'
                    : i === currentStepIndex ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  {i < currentStepIndex ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${i === currentStepIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {stepLabels[i]}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-10 h-0.5 mb-3 ${i < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">

        {/* Step 1: Enter Teacher ID */}
        {step === 'enter' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Teacher ID
              </label>
              <input
                value={teacherId}
                onChange={e => setTeacherId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && searchTeacher()}
                className="w-full px-4 py-3 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                placeholder="TCH-XXXXXXXX"
                maxLength={12}
              />
              <p className="text-xs text-slate-400 mt-1.5 text-center">Ask your teacher to share their Teacher ID from their Settings page</p>
            </div>
            <button
              onClick={searchTeacher}
              disabled={searching || teacherId.trim().length < 8}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-60">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              {searching ? 'Searching...' : 'Find Teacher'}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <FontAwesomeIcon icon={faShieldHalved} />
              Only join batches from teachers you know and trust.
            </div>
          </div>
        )}

        {/* Step 2: Pick a batch */}
        {step === 'pick' && teacher && (
          <div className="space-y-4">
            {/* Teacher found card */}
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">
                {teacher.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{teacher.full_name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">{teacher.teacher_code}</p>
              </div>
              <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 shrink-0" />
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {batches.length === 0 ? 'No active batches' : `${batches.length} available batch${batches.length > 1 ? 'es' : ''}`}
            </p>

            {batches.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                This teacher has no active batches available to join right now.
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map(batch => (
                  <button key={batch.id} onClick={() => pickBatch(batch)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer text-left">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                      {batch.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{batch.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {batch.subject && <span className="text-xs text-slate-500">{batch.subject}</span>}
                        {batch.monthly_fee != null && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5">
                            <FontAwesomeIcon icon={faIndianRupeeSign} className="text-[10px]" />
                            {batch.monthly_fee > 0 ? batch.monthly_fee.toLocaleString('en-IN') + '/mo' : 'Free'}
                          </span>
                        )}
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faChevronRight} className="text-slate-300 group-hover:text-indigo-500 text-xs shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            <button onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Search a different Teacher ID
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedBatch && teacher && (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-3">Confirm Enrollment</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faChalkboard} className="text-xs" /> Batch
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faUser} className="text-xs" /> Teacher
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{teacher.full_name}</span>
                </div>
                {selectedBatch.subject && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subject</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBatch.subject}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="text-xs" /> Monthly Fee
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedBatch.monthly_fee != null && selectedBatch.monthly_fee > 0
                      ? `₹${selectedBatch.monthly_fee.toLocaleString('en-IN')}`
                      : 'Free'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('pick')}
                className="flex-1 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
              </button>
              <button onClick={joinBatch} disabled={joining}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer disabled:opacity-60 transition-colors">
                {joining ? 'Joining...' : 'Confirm & Join'}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl mx-auto">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">You're enrolled!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Successfully joined <strong className="text-slate-700 dark:text-slate-300">{selectedBatch?.name}</strong> with {teacher?.full_name}.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 py-2.5 text-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                Join Another
              </button>
              <button onClick={() => navigate('/student/batches')}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors">
                My Batches
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
