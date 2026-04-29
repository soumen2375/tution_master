'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { GraduationCap, ArrowRight, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinBatchPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  const searchBatch = async () => {
    if (code.length < 6) return;
    setSearching(true);
    setBatchInfo(null);
    
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*, teacher:teacher_profiles(user_id, profiles(full_name))')
        .eq('invite_code', code.toUpperCase())
        .single();
      
      if (error) throw new Error('Batch not found. Please check the code.');
      setBatchInfo(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSearching(false);
    }
  };

  const joinBatch = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: student } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) throw new Error('Student profile not found');

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: student.id,
          batch_id: batchInfo.id,
          status: 'ACTIVE'
        });

      if (error) {
        if (error.code === '23505') throw new Error('You are already enrolled in this batch.');
        throw error;
      }

      toast.success(`Successfully joined ${batchInfo.name}!`);
      router.push('/student/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join batch');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-10">
        <div className="bg-primary text-primary-foreground p-3 rounded-2xl w-fit mx-auto mb-6 shadow-lg rotate-3">
          <GraduationCap size={44} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Join a Batch</h1>
        <p className="text-muted-foreground text-lg">Enter the 6-character code provided by your teacher</p>
      </div>

      <Card className="shadow-xl border-2">
        <CardHeader>
          <CardTitle>Invite Code</CardTitle>
          <CardDescription>Ask your teacher for the unique code for your batch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Input 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB1234"
              className="text-2xl font-mono tracking-widest h-14 text-center"
              maxLength={6}
            />
            <Button 
              size="lg" 
              className="h-14 px-8" 
              onClick={searchBatch} 
              disabled={searching || code.length < 6}
            >
              {searching ? <Loader2 className="animate-spin" /> : 'Find Batch'}
            </Button>
          </div>

          {batchInfo && (
            <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{batchInfo.name}</h3>
                  <p className="text-muted-foreground">{batchInfo.subject} • {batchInfo.teacher.profiles.full_name}</p>
                </div>
                <div className="bg-white p-2 rounded-lg border shadow-sm">
                  <CheckCircle2 className="text-green-600" size={32} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Batch Type</p>
                  <p className="font-semibold">{batchInfo.type}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Monthly Fee</p>
                  <p className="font-semibold">₹{batchInfo.monthly_fee}</p>
                </div>
              </div>

              <Button className="w-full text-lg h-12" size="lg" onClick={joinBatch} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Confirm & Join Batch'}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-secondary/20 justify-center py-4 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <ShieldAlert size={14} /> Join only batches from teachers you know.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
