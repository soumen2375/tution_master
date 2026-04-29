'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  PlayCircle,
  GraduationCap,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b background-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <GraduationCap size={24} />
            </div>
            <span>TutionHut</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block px-4 py-1.5 border rounded-full text-xs font-semibold uppercase tracking-wider mb-6 bg-secondary">
                  The #1 Choice for Indian Tutors
                </span>
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
                  Manage Your Tuition <br />
                  <span className="text-primary/60">Like a Professional</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  TutionHut helps you run your teaching business effortlessly.
                  Manage batches, track attendance, collect fees via UPI, and share study materials.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="h-12 px-8 text-lg rounded-full">
                      Start Your Free Trial <ArrowRight className="ml-2" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full">
                    <PlayCircle className="mr-2" /> Watch Demo
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.05)_0%,transparent_50%)]" />
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Active Tutors', value: '5,000+' },
                { label: 'Students Enrolled', value: '50,000+' },
                { label: 'States Covered', value: '28+' },
                { label: 'Fees Processed', value: '₹10Cr+' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything You Need to Scale</h2>
              <p className="text-muted-foreground text-lg">
                Stop using WhatsApp and notebooks. Switch to a system built for the modern Indian education ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Batch Management',
                  description: 'Organize students into batches based on subject, class, and schedule.',
                  icon: Users,
                },
                {
                  title: 'Smart Attendance',
                  description: 'Mark attendance in seconds. Auto-generate monthly reports for parents.',
                  icon: Calendar,
                },
                {
                  title: 'Fee Tracking (UPI)',
                  description: 'Track payments via UPI, Google Pay, and Cash. Automatic overdue reminders.',
                  icon: IndianRupee,
                },
                {
                  title: 'Study Material',
                  description: 'Upload PDF notes, assignments, and record video lectures for students.',
                  icon: BookOpen,
                },
                {
                  title: 'Student Dashboard',
                  description: 'Give students their own portal to track progress and download notes.',
                  icon: GraduationCap,
                },
                {
                  title: 'Auto Notifications',
                  description: 'Send fee reminders and class updates via Email and App notifications.',
                  icon: CheckCircle2,
                },
              ].map((feature, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow border-none bg-secondary/20">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-4">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground text-lg">
                Choose a plan that scales with your student strength. No hidden costs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: 'Starter',
                  price: '₹199',
                  students: 'Up to 30 students',
                  features: ['3 Batches', 'Attendance Tracker', 'Fee Management', 'Notes (500MB)'],
                },
                {
                  name: 'Growth',
                  price: '₹399',
                  students: 'Up to 75 students',
                  popular: true,
                  features: ['10 Batches', 'Advanced Reports', 'UPI Integration', 'Notes (5GB)', 'Video Lectures'],
                },
                {
                  name: 'Pro',
                  price: '₹699',
                  students: 'Up to 150 students',
                  features: ['Unlimited Batches', 'Custom Receipts', 'Priority Support', 'Notes (20GB)', 'Student Progress'],
                },
              ].map((plan, i) => (
                <Card key={i} className={cn(
                  "relative flex flex-col h-full",
                  plan.popular && "border-primary shadow-xl scale-105 z-10"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold font-serif italic">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="pt-8 flex-1">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="font-semibold text-sm mb-6">{plan.students}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 size={16} className="text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                      Get Started
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-2">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight mb-4">
                  <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                    <GraduationCap size={24} />
                  </div>
                  <span>TutionHut</span>
                </Link>
                <p className="text-muted-foreground max-w-sm">
                  The most powerful and easy-to-use tuition management platform built specifically for Indian educators.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#features">Features</Link></li>
                  <li><Link href="#pricing">Pricing</Link></li>
                  <li><Link href="/demo">Request Demo</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/contact">Contact</Link></li>
                  <li><Link href="/terms">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t flex flex-col md:row items-center justify-between gap-4 text-xs text-muted-foreground">
              <p>© 2026 TutionHut India. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link href="#">Twitter</Link>
                <Link href="#">Instagram</Link>
                <Link href="#">LinkedIn</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
