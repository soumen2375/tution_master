import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
  ];
  const passed = checks.filter(c => c.pass).length;
  const color = passed === 0 ? '#e2e8f0' : passed === 1 ? '#ef4444' : passed === 2 ? '#f59e0b' : '#22c55e';
  const label = passed === 0 ? '' : passed === 1 ? 'Weak' : passed === 2 ? 'Fair' : 'Strong';

  if (!password) return null;

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= passed ? color : '#e2e8f0' }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        {label && <span className="text-xs font-medium" style={{ color }}>{label}</span>}
        <div className="flex gap-3 ml-auto">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              {c.pass
                ? <CheckCircle2 size={11} className="text-green-500" />
                : <Circle size={11} className="text-slate-300" />}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {checks.map((c, i) => (
          <p key={i} className={`text-[10px] ${c.pass ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.user) {
        toast.success('Account created! Please check your email to verify.');
        navigate('/onboarding');
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 40%, #9f1239 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-16 right-16 w-72 h-72 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <div className="absolute bottom-32 left-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-2xl">
              <GraduationCap size={28} />
            </div>
            <span className="text-2xl font-bold">TutionHut</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Start Your<br />Teaching Journey<br />Today — Free
          </h1>
          <p className="text-rose-100 text-lg leading-relaxed mb-8">
            Everything you need to run a professional tuition centre in one place.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: '🎓', label: 'Student Management' },
              { icon: '📅', label: 'Attendance Tracking' },
              { icon: '💳', label: 'UPI Fee Collection' },
              { icon: '📚', label: 'Study Materials' },
              { icon: '📊', label: 'Progress Reports' },
              { icon: '🔔', label: 'Auto Reminders' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm font-medium text-rose-50">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
            <div className="flex -space-x-2">
              {['S', 'R', 'A', 'M'].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-rose-400 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: ['#be123c', '#9f1239', '#881337', '#e11d48'][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-rose-100">
              <span className="font-bold text-white">5,000+ tutors</span> already using TutionHut
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-2 rounded-xl">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-bold">TutionHut</span>
          </div>

          <h2 className="text-3xl font-extrabold mb-1">Create your account</h2>
          <p className="mb-6" style={{ color: 'var(--color-muted-foreground)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ramesh Kumar"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`pl-9 pr-10 ${confirmPassword && password !== confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline font-medium">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
            </p>

            <Button type="submit" variant="gradient" className="w-full h-11 text-base" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2" size={18} />}
              {loading ? 'Creating account...' : 'Create Free Account'}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" style={{ borderColor: 'var(--card-border)' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 text-muted-foreground font-medium" style={{ backgroundColor: 'var(--background)' }}>
                Or sign up with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/onboarding` },
            })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
