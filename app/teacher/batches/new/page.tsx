'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar as CalendarIcon, 
  MapPin, 
  Globe, 
  Plus, 
  Trash2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NewBatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    type: 'OFFLINE',
    max_students: 30,
    monthly_fee: 500,
    start_date: new Date().toISOString().split('T')[0],
  });

  const [schedule, setSchedule] = useState<any[]>([
    { day: 'Monday', startTime: '08:00', endTime: '09:30' }
  ]);

  const addScheduleItem = () => {
    setSchedule([...schedule, { day: 'Monday', startTime: '08:00', endTime: '09:30' }]);
  };

  const removeScheduleItem = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index: number, field: string, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: teacher } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher) throw new Error('Teacher profile not found');

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase
        .from('batches')
        .insert({
          ...formData,
          teacher_id: teacher.id,
          schedule: schedule,
          invite_code: inviteCode,
        });

      if (error) throw error;

      toast.success('Batch created successfully!');
      router.push('/teacher/batches');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create New Batch</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and details of your batch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Name</label>
                  <Input 
                    placeholder="e.g. Class 10 Math Morning" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    placeholder="e.g. Mathematics" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input background-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    placeholder="Describe what students will learn..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Type & Capacity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    type="button"
                    variant={formData.type === 'OFFLINE' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setFormData({...formData, type: 'OFFLINE'})}
                  >
                    <MapPin size={24} />
                    <span>Offline</span>
                  </Button>
                  <Button 
                    type="button"
                    variant={formData.type === 'ONLINE' ? 'default' : 'outline'}
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setFormData({...formData, type: 'ONLINE'})}
                  >
                    <Globe size={24} />
                    <span>Online</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Students</label>
                    <Input 
                      type="number" 
                      value={formData.max_students}
                      onChange={(e) => setFormData({...formData, max_students: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Fee (₹)</label>
                    <Input 
                      type="number" 
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData({...formData, monthly_fee: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Add session days and times</CardDescription>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={addScheduleItem}>
                  <Plus size={18} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedule.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3 relative group">
                    <div className="flex items-center gap-3">
                      <select 
                        className="flex h-9 w-full rounded-md border border-input background-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                        value={item.day}
                        onChange={(e) => updateScheduleItem(index, 'day', e.target.value)}
                      >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeScheduleItem(index)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> Start
                        </label>
                        <Input 
                          type="time" 
                          value={item.startTime}
                          onChange={(e) => updateScheduleItem(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> End
                        </label>
                        <Input 
                          type="time" 
                          value={item.endTime}
                          onChange={(e) => updateScheduleItem(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Input 
                  type="date" 
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t pt-8">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" size="lg" disabled={loading} className="px-12">
            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Create Batch'}
          </Button>
        </div>
      </form>
    </div>
  );
}
