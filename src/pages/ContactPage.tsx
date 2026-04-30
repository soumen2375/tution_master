import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, MessageCircle, Clock, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    // Simulate send (replace with actual Resend/email API call)
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
  };

  const contacts = [
    { icon: Mail, label: 'Email', value: 'support@tutionhut.in', href: 'mailto:support@tutionhut.in' },
    { icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: MessageCircle, label: 'WhatsApp', value: '+91 98765 43210', href: 'https://wa.me/919876543210' },
    { icon: MapPin, label: 'Office', value: 'Bengaluru, Karnataka 560001', href: 'https://maps.google.com' },
  ];

  const faqs = [
    { q: 'Is TutionHut free for teachers?', a: 'Yes! Our FREE plan supports up to 10 students and 1 batch at no cost. Upgrade only when you need more.' },
    { q: 'Do students need to pay anything?', a: 'No. Students access TutionHut completely free once their teacher adds them to a batch.' },
    { q: 'Can I use TutionHut on my phone?', a: 'Absolutely. TutionHut is fully responsive and works great on all smartphones and tablets.' },
    { q: 'How is my data protected?', a: 'We use Supabase with Row Level Security, 256-bit SSL encryption, and GDPR-compliant data practices.' },
    { q: 'Do you support UPI payments?', a: 'Yes. Teachers can record and track payments including UPI, cash, and bank transfers.' },
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
        <section className="py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.07) 0%, transparent 70%)' }} />
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Get in <span className="gradient-text">Touch</span></h1>
            <p className="text-lg" style={{ color: 'var(--color-muted-foreground)' }}>
              Have questions? We'd love to hear from you. Our team responds within 24 hours on business days.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12">

              {/* Contact Form */}
              <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                {sent ? (
                  <div className="text-center py-12">
                    <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p style={{ color: 'var(--color-muted-foreground)' }}>We'll get back to you within 24 business hours at <strong>{form.email}</strong>.</p>
                    <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                      Send Another
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold">Name *</label>
                          <Input placeholder="Rahul Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold">Email *</label>
                          <Input type="email" placeholder="rahul@gmail.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold">Phone</label>
                          <Input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold">Subject</label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                          >
                            <option value="">Select topic...</option>
                            <option>General Enquiry</option>
                            <option>Technical Support</option>
                            <option>Billing / Payment</option>
                            <option>Feature Request</option>
                            <option>Partnership</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold">Message *</label>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          placeholder="Tell us how we can help..."
                          value={form.message}
                          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full h-11" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send size={18} className="mr-2" />}
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="space-y-8">
                {/* Contact Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {contacts.map(({ icon: Icon, label, value, href }, i) => (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 rounded-2xl border hover:border-primary hover:bg-primary/5 transition-all group"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{label}</p>
                        <p className="text-sm font-semibold">{value}</p>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Business Hours */}
                <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <Clock size={20} className="text-primary" />
                    <h3 className="font-bold text-lg">Business Hours</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { day: 'Monday – Friday', hours: '9:00 AM – 7:00 PM IST' },
                      { day: 'Saturday', hours: '10:00 AM – 5:00 PM IST' },
                      { day: 'Sunday', hours: 'Closed' },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: 'var(--card-border)' }}>
                        <span className="font-medium">{row.day}</span>
                        <span style={{ color: 'var(--color-muted-foreground)' }}>{row.hours}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium">
                    🟢 Currently active — average response time: 2 hours
                  </p>
                </div>

                {/* FAQ */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-3">
                    {faqs.map((faq, i) => (
                      <details key={i} className="rounded-xl border p-4 cursor-pointer group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <summary className="font-semibold text-sm list-none flex justify-between items-center">
                          {faq.q}
                          <span className="text-primary ml-2 shrink-0 transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{faq.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--stat-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          © 2026 TutionHut Technologies Pvt. Ltd. ·{' '}
          <Link to="/about" className="hover:text-primary transition-colors">About</Link> ·{' '}
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link> ·{' '}
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
