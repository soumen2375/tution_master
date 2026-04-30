import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScheduleBuilder } from '@/components/teacher/ScheduleBuilder';
import { ArrowLeft, Loader2, MapPin, Globe, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { createBatch } from '@/lib/api/batches';
import type { ScheduleSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function NewBatchPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [batchType, setBatchType] = useState<'OFFLINE' | 'ONLINE' | 'HYBRID'>('OFFLINE');
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([
    { day: 'Monday', startTime: '08:00', endTime: '09:30' }
  ]);
  const [form, setForm] = useState({
    name: '', subject: '', description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '', max_students: 30, monthly_fee: 500,
    meeting_link: '', is_public: false,
  });

  const update = (field: string, value: string | number | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schedule.length === 0) { toast.error('Add at least one schedule slot'); return; }
    setLoading(true);
    try {
      const batch = await createBatch({
        ...form,
        type: batchType,
        schedule,
        end_date: form.end_date || undefined,
        meeting_link: form.meeting_link || undefined,
      });
      toast.success('Batch created successfully!');
      navigate(`/teacher/batches/${batch.id}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const batchTypeOptions = [
    { value: 'OFFLINE', label: 'Offline', desc: 'In-person classes', icon: MapPin },
    { value: 'ONLINE', label: 'Online', desc: 'Video calls / link', icon: Globe },
    { value: 'HYBRID', label: 'Hybrid', desc: 'Both offline + online', icon: Layers },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Batch</h2>
          <p className="text-muted-foreground">Set up a new batch for your students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details of your batch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Batch Name *</label>
                  <Input placeholder="e.g. Class 10 Math — Morning"
                    value={form.name} onChange={e => update('name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Subject *</label>
                  <Input placeholder="e.g. Mathematics"
                    value={form.subject} onChange={e => update('subject', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Description (optional)</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="What will students learn in this batch?"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batch Type</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                {batchTypeOptions.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBatchType(value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                      batchType === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon size={22} />
                    <div>
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
              {(batchType === 'ONLINE' || batchType === 'HYBRID') && (
                <CardContent className="-mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Meeting Link</label>
                    <Input placeholder="https://meet.google.com/..."
                      value={form.meeting_link}
                      onChange={e => update('meeting_link', e.target.value)} />
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity &amp; Fees</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Max Students</label>
                  <Input type="number" min={1} max={500}
                    value={form.max_students}
                    onChange={e => update('max_students', Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Monthly Fee (₹)</label>
                  <Input type="number" min={0}
                    value={form.monthly_fee}
                    onChange={e => update('monthly_fee', Number(e.target.value))} required />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Schedule</CardTitle>
                <CardDescription>Select days and time slots for this batch</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleBuilder value={schedule} onChange={setSchedule} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Start Date *</label>
                  <Input type="date" value={form.start_date}
                    onChange={e => update('start_date', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">End Date (optional)</label>
                  <Input type="date" value={form.end_date}
                    onChange={e => update('end_date', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary w-4 h-4"
                    checked={form.is_public}
                    onChange={e => update('is_public', e.target.checked)}
                  />
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">Make batch publicly discoverable</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Students can find this batch in the explore section (coming soon)
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t sticky bottom-0 bg-background py-4">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" size="lg" className="px-12 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Create Batch
          </Button>
        </div>
      </form>
    </div>
  );
}
