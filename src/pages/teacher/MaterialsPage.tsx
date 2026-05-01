import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faPlus, faTrash, faMagnifyingGlass, faFilter,
  faFileAlt, faVideo, faLink, faDownload, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Material {
  id: string;
  batch_id: string;
  batch_name: string;
  title: string;
  type: 'PDF' | 'VIDEO' | 'LINK' | 'OTHER';
  url: string;
  file_size_kb: number | null;
  created_at: string;
}

interface Batch { id: string; name: string; }

const materialSchema = z.object({
  batch_id: z.string().min(1, 'Select a batch'),
  title: z.string().min(2, 'Title required'),
  type: z.enum(['PDF', 'VIDEO', 'LINK', 'OTHER']),
  url: z.string().url('Enter a valid URL'),
  file_size_kb: z.number().optional(),
});
type MaterialForm = z.infer<typeof materialSchema>;

const TYPE_ICON: Record<string, any> = {
  PDF: faFileAlt, VIDEO: faVideo, LINK: faLink, OTHER: faFolder,
};
const TYPE_COLOR: Record<string, string> = {
  PDF: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  VIDEO: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  LINK: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  OTHER: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

const PAGE_SIZE = 12;

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: { type: 'PDF' },
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tp } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).single();
    if (!tp) return;

    const { data: batchData } = await supabase.from('batches').select('id,name').eq('teacher_id', tp.id).eq('status', 'ACTIVE');
    setBatches(batchData || []);
    const batchIds = (batchData || []).map(b => b.id);
    if (!batchIds.length) { setLoading(false); return; }

    const batchMap = new Map((batchData || []).map(b => [b.id, b.name]));

    const { data: notesData, error } = await supabase
      .from('notes')
      .select('id, batch_id, title, type, url, file_size_kb, created_at')
      .in('batch_id', batchIds)
      .order('created_at', { ascending: false });

    if (error) { toast.error('Failed to load materials'); setLoading(false); return; }

    setMaterials((notesData || []).map((n: any) => ({
      id: n.id,
      batch_id: n.batch_id,
      batch_name: batchMap.get(n.batch_id) || '',
      title: n.title,
      type: n.type || 'OTHER',
      url: n.url || '',
      file_size_kb: n.file_size_kb,
      created_at: n.created_at,
    })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let m = materials;
    if (search) m = m.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) m = m.filter(r => r.type === typeFilter);
    if (batchFilter) m = m.filter(r => r.batch_id === batchFilter);
    return m;
  }, [materials, search, typeFilter, batchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function onAdd(data: MaterialForm) {
    setSaving(true);
    try {
      const { error } = await supabase.from('notes').insert({
        batch_id: data.batch_id,
        title: data.title,
        type: data.type,
        url: data.url,
        file_size_kb: data.file_size_kb || null,
      });
      if (error) throw error;
      toast.success('Material added');
      setAddModal(false);
      reset({ type: 'PDF' });
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', deleteModal.id);
      if (error) throw error;
      setMaterials(prev => prev.filter(m => m.id !== deleteModal.id));
      toast.success('Material deleted');
      setDeleteModal(null);
    } catch (e: any) { toast.error(e.message); }
  }

  function formatSize(kb: number | null) {
    if (!kb) return null;
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Materials</h2>
          <p className="text-sm text-slate-500 mt-0.5">{materials.length} files shared</p>
        </div>
        <button onClick={() => { reset({ type: 'PDF' }); setAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <FontAwesomeIcon icon={faPlus} /> Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search materials..." />
        </div>
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <select value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          <option value="">All Types</option>
          <option value="PDF">PDF</option>
          <option value="VIDEO">Video</option>
          <option value="LINK">Link</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <EmptyState icon={faFolder} title="No Materials Found"
            description={search || typeFilter || batchFilter ? 'Try adjusting your filters.' : 'Upload your first study material.'}
            action={!search && !typeFilter && !batchFilter ? { label: '+ Add Material', onClick: () => setAddModal(true) } : undefined} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(m => (
              <div key={m.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLOR[m.type]}`}>
                      <FontAwesomeIcon icon={TYPE_ICON[m.type]} className="text-sm" />
                    </div>
                    <button onClick={() => setDeleteModal(m)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1">{m.title}</h3>
                  <p className="text-xs text-slate-500">{m.batch_name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{format(new Date(m.created_at), 'dd MMM yyyy')}</span>
                    {formatSize(m.file_size_kb) && <span>· {formatSize(m.file_size_kb)}</span>}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <FontAwesomeIcon icon={m.type === 'LINK' ? faLink : faDownload} /> {m.type === 'LINK' ? 'Open Link' : 'Download'}
                  </a>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-40 cursor-pointer">
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Material" size="sm"
        footer={<>
          <button onClick={() => setAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleSubmit(onAdd)} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60">
            {saving ? 'Adding...' : 'Add Material'}
          </button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Batch *</label>
            <select {...register('batch_id')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.batch_id && <p className="text-xs text-red-500 mt-1">{errors.batch_id.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Title *</label>
            <input {...register('title')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Calculus Chapter 3 Notes" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Type *</label>
              <select {...register('type')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="PDF">PDF</option>
                <option value="VIDEO">Video</option>
                <option value="LINK">Link</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Size (KB)</label>
              <input type="number" {...register('file_size_kb', { valueAsNumber: true })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">URL *</label>
            <input {...register('url')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
            {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url.message}</p>}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Material" size="sm"
        footer={<>
          <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer">Delete</button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete <strong className="text-slate-900 dark:text-slate-100">{deleteModal?.title}</strong>? Students will no longer be able to access this file.
        </p>
      </Modal>
    </div>
  );
}
