'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'TEACHER' | 'STUDENT' | false>(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if role is already set
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        router.push(`/${profile.role.toLowerCase()}/dashboard`);
        return;
      }

      setUser(user);
      setLoading(false);
    }
    checkUser();
  }, [router]);

  const selectRole = async (role: 'TEACHER' | 'STUDENT') => {
    setSubmitting(role === 'TEACHER' ? 'TEACHER' : 'STUDENT' as any);
    
    try {
      // 1. Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          role: role,
        });

      if (profileError) throw profileError;

      // 2. Create Role-Specific Profile
      if (role === 'TEACHER') {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .insert({ user_id: user.id });
        if (teacherError) throw teacherError;
      } else {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({ user_id: user.id });
        if (studentError) throw studentError;
      }

      toast.success(`Welcome to TutionHut!`);
      router.push(`/${role.toLowerCase()}/dashboard`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set up profile');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="bg-primary text-primary-foreground p-3 rounded-2xl w-fit mx-auto mb-6 shadow-lg rotate-3">
          <GraduationCap size={44} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to TutionHut</h1>
        <p className="text-muted-foreground text-lg">Tell us how you&apos;ll be using the platform</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
        <Card 
          className="relative overflow-hidden group border-2 hover:border-primary transition-all cursor-pointer"
          onClick={() => selectRole('TEACHER')}
        >
          <CardHeader className="pb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <CardTitle className="text-2xl">I&apos;m a Teacher</CardTitle>
            <CardDescription className="text-base">
              I want to manage my batches, track attendance, collect fees, and share notes with my students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full group-hover:gap-4 transition-all" variant="secondary" disabled={!!submitting}>
              {submitting === 'TEACHER' ? <Loader2 className="animate-spin" /> : <>Select Role <ArrowRight size={18} /></>}
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="relative overflow-hidden group border-2 hover:border-primary transition-all cursor-pointer"
          onClick={() => selectRole('STUDENT')}
        >
          <CardHeader className="pb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <User size={24} />
            </div>
            <CardTitle className="text-2xl">I&apos;m a Student</CardTitle>
            <CardDescription className="text-base">
              I want to access my class materials, track my attendance, and view my payment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full group-hover:gap-4 transition-all" variant="secondary" disabled={!!submitting}>
              {submitting === 'STUDENT' ? <Loader2 className="animate-spin" /> : <>Select Role <ArrowRight size={18} /></>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
