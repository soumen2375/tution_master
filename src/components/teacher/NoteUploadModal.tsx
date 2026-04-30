import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUploader } from '@/components/shared/FileUploader';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Batch } from '@/lib/types';

interface NoteUploadModalProps {
  batches: Batch[];
  defaultBatchId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function NoteUploadModal({ batches, defaultBatchId, onSuccess, onClose }: NoteUploadModalProps) {
  const [form, setForm] = useState({ title: '', description: '', batch_id: defaultBatchId || '', is_public: false });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!form.batch_id) { toast.error('Please select a batch'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: teacher } = await supabase
        .from('teacher_profiles').select('id').eq('user_id', user.id).single();
      if (!teacher) throw new Error('Teacher profile not found');

      const ext = file.name.split('.').pop();
      const path = `${teacher.id}/${form.batch_id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('notes').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('notes').getPublicUrl(path);

      const { error: dbError } = await supabase.from('notes').insert({
        batch_id: form.batch_id,
        title: form.title,
        description: form.description || null,
        file_url: publicUrl,
        file_type: ext || 'unknown',
        file_size_kb: Math.round(file.size / 1024),
        is_public: form.is_public,
        uploaded_by: user.id,
      });
      if (dbError) throw dbError;

      toast.success('Note uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Upload Study Note</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Batch *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.batch_id}
              onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}
              required
            >
              <option value="">Select batch...</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Title *</label>
            <Input
              placeholder="e.g. Trigonometry Formula Sheet"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Description (optional)</label>
            <Input
              placeholder="What does this note cover?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <FileUploader
            label="File *"
            accept=".pdf,.docx,.pptx,.jpg,.png"
            maxMb={20}
            onFile={setFile}
            hint="PDF, DOCX, PPTX, JPG or PNG • Max 20MB"
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
              className="accent-primary w-4 h-4"
            />
            <span>Make this note publicly accessible</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Upload Note
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
