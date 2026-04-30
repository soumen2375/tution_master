import { Link } from 'react-router-dom';
import { GraduationCap, Shield, Mail, Phone, MapPin, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export default function AboutPage() {
  const team = [
    { name: 'Arjun Mehta', role: 'Founder & CEO', bio: 'Ex-IIT Bombay. 8 years in EdTech. Passionate about making quality education accessible across India.', initials: 'AM', color: 'hsl(340,80%,55%)' },
    { name: 'Priya Sharma', role: 'Head of Product', bio: 'Former teacher turned product designer. Spent 5 years in classrooms before building tools for them.', initials: 'PS', color: 'hsl(210,80%,55%)' },
    { name: 'Rohit Kumar', role: 'CTO', bio: 'Full-stack engineer with 10+ years. Built scalable systems for 1M+ users at leading startups.', initials: 'RK', color: 'hsl(160,70%,45%)' },
  ];

  const milestones = [
    { year: '2023', title: 'Founded in Bengaluru', desc: 'TutionHut was born from the frustration of managing 200+ students on WhatsApp.' },
    { year: '2024', title: '5,000 Teachers Onboarded', desc: 'Grew rapidly across Maharashtra, UP, and West Bengal with word-of-mouth.' },
    { year: '2025', title: 'Razorpay & Supabase Integration', desc: 'Full payment automation and real-time dashboards launched for Pro users.' },
    { year: '2026', title: 'Expanding to 10+ States', desc: 'Serving 50,000+ students with Hindi and regional language support.' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Nav */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-1.5 rounded-xl">
              <GraduationCap size={18} />
            </div>
            TutionHut
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
            <Link to="/signup" className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.07) 0%, transparent 70%)' }} />
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 text-rose-600 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800">
              Our Story
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">
              Built for India's <span className="gradient-text">Tuition Teachers</span>
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>
              TutionHut was created to solve a real problem — India's 10 million+ private tutors managing everything from attendance to fees entirely on paper or WhatsApp. We believe every teacher deserves professional tools, not just the ones at big coaching chains.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 border-y" style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--card-border)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { icon: '🎯', title: 'Mission', desc: 'Empower every Indian tutor with tools that save time, improve accountability, and grow their teaching business.' },
                { icon: '👁️', title: 'Vision', desc: 'A future where every student in India has access to organized, trackable, and high-quality private tuition.' },
                { icon: '💡', title: 'Values', desc: 'Simplicity first. Build for Bharat. Affordable pricing. Privacy by design. No corporate jargon.' },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border p-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '50,000+', label: 'Students Served' },
                { value: '5,000+', label: 'Teachers Trust Us' },
                { value: '₹2Cr+', label: 'Fees Tracked Monthly' },
                { value: '10', label: 'States Active' },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-3xl sm:text-4xl font-black gradient-text mb-1">{s.value}</p>
                  <p className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 border-t" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--stat-bg)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 to-pink-300 opacity-30" />
              <div className="space-y-10">
                {milestones.map((m, i) => (
                  <div key={i} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className="flex-1 md:text-right md:pr-10">
                      {i % 2 === 0 && (
                        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                          <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">{m.year}</p>
                          <h3 className="font-bold text-lg mb-1">{m.title}</h3>
                          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{m.desc}</p>
                        </div>
                      )}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg z-10">
                      {m.year.slice(2)}
                    </div>
                    <div className="flex-1 md:pl-10">
                      {i % 2 !== 0 && (
                        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                          <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">{m.year}</p>
                          <h3 className="font-bold text-lg mb-1">{m.title}</h3>
                          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{m.desc}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Meet the Team</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {team.map((member, i) => (
                <div key={i} className="rounded-2xl border p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ background: `linear-gradient(135deg, ${member.color}, hsl(340,80%,65%))` }}>
                    {member.initials}
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-rose-500 font-semibold mb-3">{member.role}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to join us?</h2>
            <p className="mb-8" style={{ color: 'var(--color-muted-foreground)' }}>Start your free account today. No credit card needed.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 inline-block">
                Start Free →
              </Link>
              <Link to="/contact" className="border font-semibold px-8 py-3 rounded-xl hover:border-primary hover:text-primary transition-all inline-block" style={{ borderColor: 'var(--card-border)' }}>
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--stat-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          © 2026 TutionHut Technologies Pvt. Ltd. ·{' '}
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link> ·{' '}
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link> ·{' '}
          <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
