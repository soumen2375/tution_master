import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Bell, Pin, Trash2, Loader2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { getTeacherAnnouncements, createAnnouncement, deleteAnnouncement, togglePin } from '@/lib/api/announcements';
import { getTeacherBatches } from '@/lib/api/batches';
import type { Announcement, Batch } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', scope: 'BATCH' as 'BATCH' | 'ALL', batch_id: '', is_pinned: false });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ann, bat] = await Promise.all([getTeacherAnnouncements(), getTeacherBatches()]);
      setAnnouncements(ann);
      setBatches(bat);
      if (bat.length > 0 && !form.batch_id) setForm(f => ({ ...f, batch_id: bat[0].id }));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Fill in title and message'); return; }
    setSubmitting(true);
    try {
      await createAnnouncement({
        title: form.title,
        body: form.body,
        scope: form.scope,
        batch_id: form.scope === 'BATCH' ? form.batch_id : undefined,
        is_pinned: form.is_pinned,
      });
      toast.success('Announcement posted!');
      setShowForm(false);
      setForm({ title: '', body: '', scope: 'BATCH', batch_id: batches[0]?.id ?? '', is_pinned: false });
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id);
    setAnnouncements(a => a.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const handleTogglePin = async (a: Announcement) => {
    await togglePin(a.id, !a.is_pinned);
    setAnnouncements(prev => prev.map(x => x.id === a.id ? { ...x, is_pinned: !x.is_pinned } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">Post updates and notices to your students</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={18} className="mr-2" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Create Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Scope */}
              <div className="flex gap-3">
                {[
                  { value: 'BATCH', label: 'Specific Batch' },
                  { value: 'ALL', label: 'All My Students' },
                ].map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, scope: s.value as 'BATCH' | 'ALL' }))}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                      form.scope === s.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {form.scope === 'BATCH' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Select Batch *</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={form.batch_id}
                    onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}
                    required
                  >
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold">Title *</label>
                <Input placeholder="e.g. Holiday schedule for Diwali"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Message *</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Write your announcement here..."
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary w-4 h-4"
                  checked={form.is_pinned}
                  onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                <span className="text-sm font-medium">📌 Pin this announcement to the top</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Post Announcement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-20 text-muted-foreground animate-pulse italic">Loading announcements...</div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map(a => (
            <Card key={a.id} className={cn('transition-all hover:shadow-md', a.is_pinned && 'border-l-4 border-l-primary')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                      <Bell size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold">{a.title}</h3>
                        {a.is_pinned && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">
                            📌 Pinned
                          </span>
                        )}
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          a.scope === 'BATCH' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                        )}>
                          {a.scope === 'BATCH' ? (a.batch as { name: string } | undefined)?.name ?? 'Batch' : 'All Students'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 uppercase font-bold mt-2">
                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => handleTogglePin(a)} title={a.is_pinned ? 'Unpin' : 'Pin'}>
                      <Pin size={16} className={a.is_pinned ? 'text-amber-500' : ''} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleDelete(a.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-20 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <Megaphone size={48} className="text-muted-foreground opacity-30" />
            <div>
              <h3 className="text-xl font-bold">No announcements yet</h3>
              <p className="text-muted-foreground mt-1">Post your first announcement to keep students updated.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
