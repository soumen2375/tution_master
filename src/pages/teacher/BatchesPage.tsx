import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faChalkboard, faUsers, faLink, faPen,
  faTrash, faEye, faEyeSlash, faCopy, faCheck,
  faShareNodes, faCalendar, faIndianRupeeSign,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Hindi','Social Science','Computer Science','Economics','History','Other'];

const batchSchema = z.object({
  name: z.string().min(2,'Name required'),
  subject: z.string().min(1,'Subject required'),
  description: z.string().optional(),
  type: z.enum(['OFFLINE','ONLINE','HYBRID']),
  start_date: z.string().min(1,'Start date required'),
  monthly_fee: z.number().min(0),
  max_students: z.number().min(1).max(500),
  meeting_link: z.string().optional(),
  is_public: z.boolean(),
});
type BatchForm = z.infer<typeof batchSchema>;

interface Batch {
  id: string; name: string; subject: string; description?: string;
  type: string; status: string; start_date: string;
  monthly_fee: number; max_students: number; invite_code: string;
  meeting_link?: string; is_public: boolean;
  enrollments?: {count:number}[];
}

const STATUS_COLOR: Record<string,string> = {
  ACTIVE:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  UPCOMING:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Batch|null>(null);
  const [editing, setEditing] = useState<Batch|null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string|null>(null);
  const [teacherId, setTeacherId] = useState<string|null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState:{errors} } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: { type:'OFFLINE', monthly_fee:0, max_students:30, is_public:false },
  });

  useEffect(()=>{ loadData(); },[]);

  async function loadData() {
    setLoading(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    const { data:tp } = await supabase.from('teacher_profiles').select('id').eq('user_id',user.id).single();
    if (!tp) return;
    setTeacherId(tp.id);
    const { data, error } = await supabase.from('batches')
      .select('*, enrollments(count)').eq('teacher_id',tp.id).order('created_at',{ascending:false});
    if (error) toast.error('Failed to load batches');
    else setBatches(data||[]);
    setLoading(false);
  }

  function openCreate() { reset({ type:'OFFLINE', monthly_fee:0, max_students:30, is_public:false }); setEditing(null); setModalOpen(true); }
  function openEdit(b: Batch) {
    setEditing(b);
    reset({ name:b.name, subject:b.subject, description:b.description||'', type:b.type as 'OFFLINE'|'ONLINE'|'HYBRID',
      start_date:b.start_date, monthly_fee:b.monthly_fee, max_students:b.max_students,
      meeting_link:b.meeting_link||'', is_public:b.is_public });
    setModalOpen(true);
  }

  async function onSubmit(data: BatchForm) {
    if (!teacherId) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('batches').update(data).eq('id',editing.id);
        if (error) throw error;
        setBatches(prev => prev.map(b => b.id===editing.id ? {...b,...data} : b));
        toast.success('Batch updated');
      } else {
        const invite_code = Math.random().toString(36).substring(2,8).toUpperCase();
        const { data:nb, error } = await supabase.from('batches')
          .insert({ ...data, teacher_id:teacherId, invite_code, schedule:[] }).select().single();
        if (error) throw error;
        setBatches(prev => [nb,...prev]);
        toast.success('Batch created successfully');
      }
      setModalOpen(false);
    } catch (e:unknown) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await supabase.from('enrollments').delete().eq('batch_id',deleteModal.id);
      const { error } = await supabase.from('batches').delete().eq('id',deleteModal.id);
      if (error) throw error;
      setBatches(prev => prev.filter(b => b.id!==deleteModal.id));
      toast.success('Batch deleted');
      setDeleteModal(null);
    } catch (e:unknown) { toast.error((e as Error).message); }
    finally { setDeleting(false); }
  }

  function toggleReveal(id:string) {
    setRevealedCodes(prev => { const s=new Set(prev); s.has(id)?s.delete(id):s.add(id); return s; });
  }
  async function copyCode(code:string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(()=>setCopiedCode(null),2000);
    toast.success('Join code copied!');
  }

  const enrollCount = (b:Batch) => b.enrollments?.[0]?.count ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Batches</h2>
          <p className="text-sm text-slate-500 mt-0.5">{batches.length} total</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus}/> New Batch
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length:3}).map((_,i)=><CardSkeleton key={i}/>)}
        </div>
      ) : batches.length===0 ? (
        <EmptyState icon={faChalkboard} title="No Batches Yet"
          description="Create your first batch to start managing students and classes."
          action={{ label:'+ Create Batch', onClick:openCreate }}/>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map(b=>(
            <div key={b.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              {/* Card header */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{b.name}</h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{b.subject}</p>
                  </div>
                  <span className={`badge shrink-0 ${STATUS_COLOR[b.status]||STATUS_COLOR.ACTIVE}`}>{b.status}</span>
                </div>

                {b.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{b.description}</p>}

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} className="w-3.5 text-slate-400"/>
                    <span>{enrollCount(b)} / {b.max_students} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="w-3.5 text-slate-400"/>
                    <span>₹{b.monthly_fee.toLocaleString('en-IN')}/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="w-3.5 text-slate-400"/>
                    <span>Started {new Date(b.start_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  </div>
                  {b.meeting_link && (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faLink} className="w-3.5 text-slate-400"/>
                      <a href={b.meeting_link} target="_blank" rel="noreferrer"
                        className="text-indigo-600 hover:underline truncate">{b.type} link</a>
                    </div>
                  )}
                </div>

                {/* Invite code */}
                {b.invite_code && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 shrink-0">Join Code:</span>
                    <span className={`flex-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 ${!revealedCodes.has(b.id)?'blur-sm':''}`}>
                      {b.invite_code}
                    </span>
                    <button onClick={()=>toggleReveal(b.id)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      <FontAwesomeIcon icon={revealedCodes.has(b.id)?faEyeSlash:faEye} className="text-xs"/>
                    </button>
                    <button onClick={()=>copyCode(b.invite_code)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer">
                      <FontAwesomeIcon icon={copiedCode===b.invite_code?faCheck:faCopy} className="text-xs"/>
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <button onClick={()=>openEdit(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
                  <FontAwesomeIcon icon={faPen}/>Edit
                </button>
                <button onClick={()=>copyCode(b.invite_code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
                  <FontAwesomeIcon icon={faShareNodes}/>Share
                </button>
                <button onClick={()=>setDeleteModal(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer ml-auto">
                  <FontAwesomeIcon icon={faTrash}/>Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Batch':'Create New Batch'} size="lg"
        footer={<>
          <button onClick={()=>setModalOpen(false)} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60">
            {saving?'Saving...':(editing?'Save Changes':'Create Batch')}
          </button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Batch Name *</label>
              <input {...register('name')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="e.g. Class 10 Maths A"/>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
              <select {...register('subject')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select subject</option>
                {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Brief description of this batch..."/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
              <select {...register('type')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="OFFLINE">Offline</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Monthly Fee (₹)</label>
              <input type="number" {...register('monthly_fee',{valueAsNumber:true})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Max Students</label>
              <input type="number" {...register('max_students',{valueAsNumber:true})} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="30"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Start Date *</label>
              <input type="date" {...register('start_date')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"/>
              {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Meeting Link</label>
              <input {...register('meeting_link')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://meet.google.com/..."/>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_public" {...register('is_public')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"/>
            <label htmlFor="is_public" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Make this batch discoverable publicly</label>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteModal} onClose={()=>setDeleteModal(null)} title="Delete Batch" size="sm"
        footer={<>
          <button onClick={()=>setDeleteModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60">
            {deleting?'Deleting...':'Yes, Delete'}
          </button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This will permanently delete <span className="font-semibold text-slate-900 dark:text-slate-100">{deleteModal?.name}</span> and unenroll all students. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
