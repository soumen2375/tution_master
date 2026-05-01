import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn, faPlus, faTrash, faPenToSquare,
  faThumbTack, faBell,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: 'BATCH' | 'ALL';
  batch_id: string | null;
  batch_name: string | null;
  is_pinned: boolean;
  created_at: string;
}

interface Batch { id: string; name: string; }

const annSchema = z.object({
  title: z.string().min(2, 'Title required'),
  body: z.string().min(5, 'Message required'),
  scope: z.enum(['BATCH', 'ALL']),
  batch_id: z.string().optional(),
  is_pinned: z.boolean().optional(),
});
type AnnForm = z.infer<typeof annSchema>;

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<Announcement | null>(null);
  const [deleteModal, setDeleteModal] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AnnForm>({
    resolver: zodResolver(annSchema),
    defaultValues: { scope: 'BATCH', is_pinned: false },
  });
  const watchScope = watch('scope');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tp } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single();
    if (!tp) return;

    const { data: batchData } = await supabase.from('batches').select('id,name').eq('teacher_id', tp.id).eq('status', 'ACTIVE');
    setBatches(batchData || []);

    const { data: annData, error } = await supabase
      .from('announcements')
      .select('id, title, body, scope, batch_id, is_pinned, created_at, batch:batches(name)')
      .eq('teacher_id', tp.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) { toast.error('Failed to load'); setLoading(false); return; }

    setAnnouncements((annData || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      scope: a.scope,
      batch_id: a.batch_id,
      batch_name: a.batch?.name || null,
      is_pinned: a.is_pinned,
      created_at: a.created_at,
    })));
    setLoading(false);
  }

  function openAdd() { reset({ scope: 'BATCH', is_pinned: false }); setAddModal(true); }
  function openEdit(ann: Announcement) {
    setEditModal(ann);
    reset({ title: ann.title, body: ann.body, scope: ann.scope, batch_id: ann.batch_id || '', is_pinned: ann.is_pinned });
  }

  async function onSubmit(data: AnnForm) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: tp } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single();
      if (!tp) throw new Error('Teacher profile not found');

      const payload = {
        teacher_id: tp.id,
        title: data.title,
        body: data.body,
        scope: data.scope,
        batch_id: data.scope === 'BATCH' ? (data.batch_id || null) : null,
        is_pinned: data.is_pinned ?? false,
      };
      if (editModal) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editModal.id);
        if (error) throw error;
        toast.success('Announcement updated');
        setEditModal(null);
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
        toast.success('Announcement posted');
        setAddModal(false);
      }
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', deleteModal.id);
      if (error) throw error;
      setAnnouncements(prev => prev.filter(a => a.id !== deleteModal.id));
      toast.success('Announcement deleted');
      setDeleteModal(null);
    } catch (e: any) { toast.error(e.message); }
  }

  async function togglePin(ann: Announcement) {
    try {
      const { error } = await supabase.from('announcements').update({ is_pinned: !ann.is_pinned }).eq('id', ann.id);
      if (error) throw error;
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_pinned: !a.is_pinned } : a));
      toast.success(ann.is_pinned ? 'Unpinned' : 'Pinned');
    } catch (e: any) { toast.error(e.message); }
  }

  const AnnFormFields = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['BATCH', 'ALL'].map(s => (
          <button key={s} type="button" onClick={() => setValue('scope', s as 'BATCH' | 'ALL')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
              watchScope === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
            }`}>
            {s === 'BATCH' ? 'Specific Batch' : 'All Students'}
          </button>
        ))}
      </div>
      {watchScope === 'BATCH' && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Batch</label>
          <select {...register('batch_id')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Title *</label>
        <input {...register('title')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Holiday schedule for Diwali" />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Message *</label>
        <textarea {...register('body')} rows={4}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Write your announcement..." />
        {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" {...register('is_pinned')} className="rounded border-slate-300 accent-indigo-600 cursor-pointer" />
        <span className="text-sm text-slate-700 dark:text-slate-300">Pin to top</span>
      </label>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Announcements</h2>
          <p className="text-sm text-slate-500 mt-0.5">{announcements.length} announcements</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus} /> New Announcement
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 skeleton" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <EmptyState icon={faBullhorn} title="No Announcements"
            description="Post your first announcement to keep students informed."
            action={{ label: '+ New Announcement', onClick: openAdd }} />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm transition-all ${ann.is_pinned ? 'border-l-4 border-l-indigo-500 border-r border-t border-b border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FontAwesomeIcon icon={faBell} className="text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{ann.title}</h3>
                        {ann.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded">
                            <FontAwesomeIcon icon={faThumbTack} className="text-xs" /> Pinned
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${ann.scope === 'BATCH' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {ann.scope === 'BATCH' ? (ann.batch_name || 'Batch') : 'All Students'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{ann.body}</p>
                      <p className="text-xs text-slate-400 mt-2">{format(new Date(ann.created_at), 'dd MMM yyyy, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => togglePin(ann)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${ann.is_pinned ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      title={ann.is_pinned ? 'Unpin' : 'Pin'}>
                      <FontAwesomeIcon icon={faThumbTack} className="text-sm" />
                    </button>
                    <button onClick={() => openEdit(ann)}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors cursor-pointer" title="Edit">
                      <FontAwesomeIcon icon={faPenToSquare} className="text-sm" />
                    </button>
                    <button onClick={() => setDeleteModal(ann)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer" title="Delete">
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Announcement" size="md"
        footer={<>
          <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Posting...' : 'Post Announcement'}
          </button>
        </>}>
        <AnnFormFields />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Announcement" size="md"
        footer={<>
          <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>}>
        <AnnFormFields />
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Announcement" size="sm"
        footer={<>
          <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer">Delete</button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete <strong className="text-slate-900 dark:text-slate-100">{deleteModal?.title}</strong>? Students will no longer see this announcement.
        </p>
      </Modal>
    </div>
  );
}
