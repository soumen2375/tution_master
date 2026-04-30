import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useI18n } from '@/lib/i18n';
import {
  BookOpen, Users, CreditCard, CheckCircle2, ArrowRight, PlayCircle,
  GraduationCap, Calendar, IndianRupee, Bell, Star, Quote, Zap, Shield,
  Globe, Twitter, Instagram, Linkedin, X, ChevronRight, Smartphone,
  BarChart3, FileText, Video, UserCheck,
} from 'lucide-react';

// ── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ strings }: { strings: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = strings[index % strings.length];
    let timeout: ReturnType<typeof setTimeout>;
    if (!isDeleting && displayed === current) {
      timeout = setTimeout(() => setIsDeleting(true), 1800);
    } else if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setIndex(i => i + 1);
    } else {
      timeout = setTimeout(() => {
        setDisplayed(prev => isDeleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1));
      }, isDeleting ? 40 : 60);
    }
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, index, strings]);

  return <span className="gradient-text typewriter-cursor">{displayed}</span>;
}

// ── Counter animation ─────────────────────────────────────────────────────────
function useCountUp(end: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

// ── Demo Modal ────────────────────────────────────────────────────────────────
function DemoModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (!ref.current?.contains(e.target as Node)) onClose(); }}>
      <div ref={ref} className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-1.5 rounded-lg">
              <GraduationCap size={16} />
            </div>
            <span className="font-bold">TutionHut — Product Demo</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="aspect-video bg-slate-900 relative">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
            title="TutionHut Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            See how 5,000+ tutors use TutionHut daily
          </p>
          <Link to="/signup" onClick={onClose}>
            <Button variant="gradient" size="sm">
              Start Free Trial <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const featureIcons = [Users, Calendar, IndianRupee, BookOpen, GraduationCap, Bell];

const howItWorksSteps = [
  { step: '01', icon: UserCheck, title: 'Sign Up as Teacher', desc: 'Create your account in 60 seconds. Choose your role and set up your profile.' },
  { step: '02', icon: Users, title: 'Create Your Batches', desc: 'Organize students by subject, class, or timing. Each batch gets a unique invite code.' },
  { step: '03', icon: Calendar, title: 'Mark Attendance Daily', desc: 'Tap once to mark students present or absent. Auto-reports sent to parents monthly.' },
  { step: '04', icon: IndianRupee, title: 'Collect Fees Digitally', desc: 'Track cash, UPI, and bank payments. Automated reminders for overdue students.' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useI18n();
  const [showDemo, setShowDemo] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
      <Header />

      <main className="flex-1 pt-16">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden py-24 lg:py-36">
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="blob-animate absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #e11d48 0%, #ec4899 100%)' }} />
            <div className="blob-animate absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #f43f5e 0%, #fb7185 100%)', animationDelay: '3s' }} />
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 70%)' }} />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8 border"
                style={{ borderColor: 'rgba(225,29,72,0.3)', backgroundColor: 'rgba(225,29,72,0.06)', color: '#e11d48' }}>
                <Zap size={12} />
                {t.hero.badge}
              </span>
            </div>

            <div className="animate-fade-up-delay-1">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 leading-[1.05]">
                {t.hero.headline1}
                <br />
                <span style={{ color: 'var(--foreground)' }}>{t.hero.headline2}</span>
              </h1>
            </div>

            <div className="animate-fade-up-delay-2 h-14 flex items-center justify-center mb-4 text-2xl sm:text-4xl font-bold">
              <Typewriter strings={t.hero.typewriter} />
            </div>

            <div className="animate-fade-up-delay-3">
              <p className="text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                style={{ color: 'var(--color-muted-foreground)' }}>
                {t.hero.subtitle}
              </p>
            </div>

            <div className="animate-fade-up-delay-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="h-12 px-8 text-base shadow-lg shadow-rose-200 dark:shadow-rose-900 w-full sm:w-auto">
                  {t.hero.cta} <ArrowRight size={18} className="ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base w-full sm:w-auto"
                onClick={() => setShowDemo(true)}>
                <PlayCircle size={18} className="mr-2" />
                {t.hero.demo}
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-up-delay-4">
              <div className="flex -space-x-2">
                {['R','P','A','M','S'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `hsl(${340 + i * 15},85%,55%)` }}>{l}</div>
                ))}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>5,000+</span> tutors trust TutionHut
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" stroke="none" />)}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} className="py-12 border-y" style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--card-border)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              {t.stats.map((s, i) => (
                <div key={i}>
                  <p className="text-2xl sm:text-4xl font-extrabold gradient-text mb-1">{s.value}</p>
                  <p className="text-xs sm:text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold uppercase tracking-widest text-rose-500 mb-3 block">Simple Process</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started in 4 Easy Steps</h2>
              <p className="max-w-xl mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
                No training needed. Most teachers are fully set up within 10 minutes.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="relative group">
                  {i < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(100%-1px)] w-full h-0.5 z-0"
                      style={{ background: 'linear-gradient(to right, #e11d48, transparent)' }} />
                  )}
                  <div className="relative z-10 rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100 dark:hover:shadow-rose-950"
                    style={{ backgroundColor: 'var(--feature-card-bg)', borderColor: 'var(--card-border)' }}>
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #e11d48, #ec4899)' }}>
                        <step.icon size={22} className="text-white" />
                      </div>
                      <span className="text-3xl font-black opacity-10">{step.step}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/signup">
                <Button variant="gradient" size="lg" className="h-12 px-10">
                  Start for Free — No Credit Card <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24" style={{ backgroundColor: 'var(--stat-bg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold uppercase tracking-widest text-rose-500 mb-3 block">
                {t.features.subtitle}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.features.title}</h2>
              <p className="max-w-2xl mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
                Stop using WhatsApp and notebooks. Switch to a system built for the modern Indian education ecosystem.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.features.items.map((feat, i) => {
                const Icon = featureIcons[i];
                return (
                  <div key={i}
                    className="group rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100 dark:hover:shadow-rose-950 cursor-default"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                      style={{ background: 'linear-gradient(135deg, #e11d48, #ec4899)' }}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DEVICE PREVIEW ── */}
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-sm font-semibold uppercase tracking-widest text-rose-500 mb-3 block">Works Everywhere</span>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Use TutionHut on Any Device</h2>
                <div className="space-y-4">
                  {[
                    { icon: Smartphone, title: 'Mobile Friendly', desc: 'Mark attendance in class from your phone in under 10 seconds.' },
                    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Instant charts for attendance rate, fee collection, and student progress.' },
                    { icon: FileText, title: 'Auto Reports', desc: 'Monthly PDFs auto-generated and shareable with parents and students.' },
                    { icon: Video, title: 'Video Lectures', desc: 'Upload recorded lectures — students watch anytime, on any device.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.12), rgba(236,72,153,0.12))' }}>
                        <item.icon size={18} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.title}</p>
                        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <button onClick={() => setShowDemo(true)}
                    className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #e11d48, #ec4899)' }}>
                      <PlayCircle size={24} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Watch 2-min Demo</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>See the full product in action</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl p-1 shadow-2xl shadow-rose-200 dark:shadow-rose-950"
                  style={{ background: 'linear-gradient(135deg, #e11d48, #ec4899)' }}>
                  <div className="rounded-[22px] overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
                    {/* Mock Dashboard Preview */}
                    <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--feature-card-bg)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <div className="flex-1 mx-3 h-5 rounded bg-secondary" />
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="h-4 w-36 rounded gradient-bg opacity-80" />
                      <div className="grid grid-cols-3 gap-3">
                        {['bg-emerald-100 dark:bg-emerald-900','bg-amber-100 dark:bg-amber-900','bg-blue-100 dark:bg-blue-900'].map((bg, i) => (
                          <div key={i} className={`rounded-xl p-3 ${bg}`}>
                            <div className="h-3 w-8 rounded bg-current opacity-20 mb-2" />
                            <div className="h-5 w-12 rounded bg-current opacity-30" />
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--card-border)' }}>
                        <div className="h-3 w-24 rounded bg-secondary mb-3" />
                        <div className="space-y-2">
                          {[85, 100, 90, 95].map((w, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-2 rounded-full" style={{ width: `${w}%`, background: 'linear-gradient(to right, #e11d48, #ec4899)' }} />
                              <span className="text-[10px] font-bold text-rose-500">{w}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: 'var(--card-border)' }}>
                            <div className="h-2.5 w-20 rounded bg-secondary" />
                            <div className="h-2 w-14 rounded bg-secondary opacity-60" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl border shadow-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: 'var(--card-border)' }}>
                  <div className="text-center">
                    <p className="text-white font-black text-lg leading-none">94%</p>
                    <p className="text-green-100 text-[9px] leading-tight">Attendance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-24" style={{ backgroundColor: 'var(--stat-bg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold uppercase tracking-widest text-rose-500 mb-3 block">
                {t.testimonials.subtitle}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold">{t.testimonials.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {t.testimonials.items.map((q, i) => (
                <div key={i} className="rounded-2xl p-6 border relative hover:-translate-y-1 transition-all duration-300"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <Quote size={32} className="text-rose-200 dark:text-rose-900 mb-4" />
                  <p className="text-sm leading-relaxed mb-6">"{q.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: `hsl(${340 + i * 20},80%,55%)` }}>
                      {q.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{q.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{q.role}</p>
                    </div>
                    <div className="ml-auto flex">
                      {[...Array(5)].map((_, j) => <Star key={j} size={12} fill="#f59e0b" stroke="none" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <span className="text-sm font-semibold uppercase tracking-widest text-rose-500 mb-3 block">Pricing</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.pricing.title}</h2>
              <p className="max-w-xl mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>{t.pricing.subtitle}</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">
              {t.pricing.plans.map((plan, i) => (
                <div key={i} className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.popular ? 'shadow-2xl shadow-rose-200 dark:shadow-rose-950 md:scale-105 z-10' : ''}`}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: plan.popular ? '#e11d48' : 'var(--card-border)',
                  }}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #e11d48, #ec4899)' }}>
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-muted-foreground)' }}>{plan.students}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold gradient-text">{plan.price}</span>
                      <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-rose-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button variant={plan.popular ? 'gradient' : 'outline'} className="w-full">
                      {t.pricing.cta} <ArrowRight size={16} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-sm mt-8" style={{ color: 'var(--color-muted-foreground)' }}>
              All plans include a <strong>14-day free trial</strong>. No credit card required. Cancel anytime.
            </p>
          </div>
        </section>

        {/* ── TRUST BADGES ── */}
        <section className="py-12 border-y" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--stat-bg)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-center text-sm mb-8 font-medium uppercase tracking-widest" style={{ color: 'var(--color-muted-foreground)' }}>
              Trusted &amp; Secure
            </p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 items-center">
              {[
                { icon: Shield, label: 'Bank-grade Security' },
                { icon: Zap, label: '99.9% Uptime' },
                { icon: Globe, label: 'Works Offline' },
                { icon: CreditCard, label: 'UPI Ready' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                  <Icon size={18} className="text-rose-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="rounded-3xl p-10 sm:p-16 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #ec4899 50%, #f43f5e 100%)' }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"
                style={{ background: 'radial-gradient(circle, white, transparent)' }} />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-20 translate-y-1/2 -translate-x-1/2"
                style={{ background: 'radial-gradient(circle, white, transparent)' }} />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 relative z-10">{t.cta.title}</h2>
              <p className="text-rose-100 text-lg mb-8 relative z-10">{t.cta.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link to="/signup">
                  <Button className="bg-white text-rose-600 hover:bg-rose-50 h-12 px-8 text-base font-bold rounded-full shadow-lg w-full sm:w-auto">
                    {t.cta.button} <ArrowRight size={18} className="ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="border-2 border-white bg-transparent text-white hover:bg-white/10 h-12 px-8 text-base rounded-full w-full sm:w-auto">
                    Already have an account? Log in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ backgroundColor: 'var(--footer-bg)', color: 'var(--footer-fg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div className="sm:col-span-2">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
                  <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-1.5 rounded-xl">
                    <GraduationCap size={20} />
                  </div>
                  TutionHut
                </Link>
                <p className="text-sm leading-relaxed max-w-xs">{t.footer.tagline}</p>
                <div className="flex gap-4 mt-6">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors hover:text-white hover:bg-white/10">
                    <Twitter size={18} />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors hover:text-white hover:bg-white/10">
                    <Instagram size={18} />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors hover:text-white hover:bg-white/10">
                    <Linkedin size={18} />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{t.footer.product}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">{t.footer.links.features}</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">{t.footer.links.pricing}</a></li>
                  <li>
                    <button onClick={() => setShowDemo(true)} className="hover:text-white transition-colors text-left">
                      {t.footer.links.demo}
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{t.footer.company}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link to="/about" className="hover:text-white transition-colors">{t.footer.links.about}</Link></li>
                  <li><Link to="/contact" className="hover:text-white transition-colors">{t.footer.links.contact}</Link></li>
                  <li><Link to="/terms" className="hover:text-white transition-colors">{t.footer.links.terms}</Link></li>
                  <li><Link to="/privacy" className="hover:text-white transition-colors">{t.footer.links.privacy}</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <p>{t.footer.copyright}</p>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-rose-400" />
                <span>Secured with 256-bit SSL</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
