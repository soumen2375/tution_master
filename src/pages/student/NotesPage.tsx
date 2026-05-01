import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faMagnifyingGlass, faFilter,
  faFileAlt, faVideo, faLink, faDownload,
} from '@fortawesome/free-solid-svg-icons';
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

const TYPE_ICON: Record<string, any> = {
  PDF: faFileAlt, VIDEO: faVideo, LINK: faLink, OTHER: faFolder,
};
const TYPE_COLOR: Record<string, string> = {
  PDF: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  VIDEO: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  LINK: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  OTHER: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export default function NotesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: student } = await supabase.from('student_profiles').select('id').eq('user_id', user.id).single();
        if (!student) return;

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('batch_id, batch:batches(name)')
          .eq('student_id', student.id)
          .eq('status', 'ACTIVE');

        const batchList: Batch[] = (enrollments || []).map((e: any) => ({ id: e.batch_id, name: e.batch?.name || '' }));
        setBatches(batchList);
        const batchIds = batchList.map(b => b.id);
        if (!batchIds.length) { setLoading(false); return; }

        const batchMap = new Map(batchList.map(b => [b.id, b.name]));
        const { data, error } = await supabase
          .from('notes')
          .select('id, batch_id, title, type, url, file_size_kb, created_at')
          .in('batch_id', batchIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMaterials((data || []).map((n: any) => ({
          id: n.id,
          batch_id: n.batch_id,
          batch_name: batchMap.get(n.batch_id) || '',
          title: n.title,
          type: n.type || 'OTHER',
          url: n.url || '',
          file_size_kb: n.file_size_kb,
          created_at: n.created_at,
        })));
      } catch (e: any) { toast.error('Failed to load materials'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let m = materials;
    if (search) m = m.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
    if (batchFilter) m = m.filter(r => r.batch_id === batchFilter);
    if (typeFilter) m = m.filter(r => r.type === typeFilter);
    return m;
  }, [materials, search, batchFilter, typeFilter]);

  function formatSize(kb: number | null) {
    if (!kb) return null;
    return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Materials</h2>
        <p className="text-sm text-slate-500 mt-0.5">{materials.length} files available</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search materials..." />
        </div>
        {batches.length > 1 && (
          <div className="relative">
            <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
          <option value="">All Types</option>
          <option value="PDF">PDF</option>
          <option value="VIDEO">Video</option>
          <option value="LINK">Link</option>
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
            description={search || batchFilter || typeFilter ? 'Try adjusting your filters.' : 'Your teacher hasn\'t uploaded any materials yet.'} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(m => (
            <div key={m.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all overflow-hidden">
              <div className="p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${TYPE_COLOR[m.type]}`}>
                  <FontAwesomeIcon icon={TYPE_ICON[m.type]} className="text-sm" />
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
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800">
                  <FontAwesomeIcon icon={m.type === 'LINK' ? faLink : faDownload} />
                  {m.type === 'LINK' ? 'Open Link' : m.type === 'VIDEO' ? 'Watch' : 'Download'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
