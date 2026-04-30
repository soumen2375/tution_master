import { Link } from 'react-router-dom';
import { GraduationCap, Lock } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. What Data We Collect',
      content: `We collect the following types of information when you use TutionHut:
• Account Data: Name, email address, phone number, and profile photo.
• Teacher Data: Institution name, subjects taught, bio, and subscription/payment details.
• Student Data: Class, guardian information, batch enrollment, and academic performance.
• Usage Data: Session logs, feature interactions, and device/browser type for analytics.
• Payment Data: Processed entirely via Razorpay. We store only the receipt number and amount — never card or UPI details.`,
    },
    {
      title: '2. How We Use Your Data',
      content: `We use your data solely to:
• Operate and maintain the TutionHut platform.
• Display relevant information to teachers and their enrolled students.
• Send transactional notifications (fee reminders, session alerts).
• Process subscription payments.
• Improve platform performance through aggregated analytics.
We do NOT use your data for advertising, and we do NOT sell it to any third party.`,
    },
    {
      title: '3. Data Sharing',
      content: `Your data is shared with:
• Supabase Inc. (database hosting, authentication) — GDPR compliant.
• Razorpay (payment processing) — PCI DSS compliant.
• Resend (transactional email) — No marketing use.
No other third parties have access to your personally identifiable information.`,
    },
    {
      title: '4. Data Storage & Security',
      content: `All data is stored on Supabase servers in the Asia-Pacific (Mumbai) region. We implement Row Level Security (RLS) so each user can only access their own data. Connections are encrypted with 256-bit SSL/TLS. We conduct regular security reviews.`,
    },
    {
      title: '5. Student Privacy',
      content: `We take student privacy seriously. Student data is accessible only to: (a) the student themselves, (b) teachers who have enrolled that student, and (c) the student's guardian if provided. No student data is publicly visible. If a student is under 13, parental consent must be obtained by the enrolling teacher.`,
    },
    {
      title: '6. Cookies',
      content: `TutionHut uses essential cookies only — for authentication session management. We do not use tracking cookies, marketing pixels, or third-party analytics cookies. You cannot opt out of essential cookies as they are required for the platform to function.`,
    },
    {
      title: '7. Your Rights',
      content: `Under applicable law, you have the right to:
• Access: Request a copy of your personal data.
• Correction: Update inaccurate information via your profile settings.
• Deletion: Request account and data deletion by emailing privacy@tutionhut.in.
• Portability: Export your data in JSON format from your account settings.
• Objection: Opt out of any non-essential communications.`,
    },
    {
      title: '8. Data Retention',
      content: `Active account data is retained as long as your account exists. If you delete your account, your personal data is removed within 30 days. Anonymised usage statistics may be retained indefinitely for platform improvement.`,
    },
    {
      title: '9. Children\'s Privacy',
      content: `TutionHut is not directed at children under 13. Teachers who enrol students under 13 are responsible for obtaining parental consent. We do not knowingly collect data directly from children without such consent.`,
    },
    {
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy periodically. Significant changes will be communicated via email. Continued use of the Platform after changes constitutes acceptance of the revised policy.`,
    },
    {
      title: '11. Contact for Privacy',
      content: `For privacy-related questions or data requests, contact: privacy@tutionhut.in. Postal address: TutionHut Technologies Pvt. Ltd., Bengaluru, Karnataka 560001, India. We will respond within 10 business days.`,
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Lock size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                Last updated: 30 April 2026 · We respect your privacy
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>TL;DR:</strong> We collect only what's needed to run the platform. We never sell your data. Students and teachers each see only their own data. You can delete your account anytime.
            </p>
          </div>
        </div>

        {/* TOC */}
        <nav className="mb-10 p-5 rounded-2xl border" style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--card-border)' }}>
          <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted-foreground)' }}>Contents</h2>
          <ul className="space-y-1">
            {sections.map((s, i) => (
              <li key={i}>
                <a href={`#priv-${i}`} className="text-sm hover:text-primary transition-colors">{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={i} id={`priv-${i}`}>
              <h2 className="text-xl font-bold mb-3 text-primary">{s.title}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-muted-foreground)' }}>{s.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row gap-4" style={{ borderColor: 'var(--card-border)' }}>
          <Link to="/contact" className="text-sm font-semibold hover:text-primary transition-colors">Privacy Questions → Contact Us</Link>
          <Link to="/terms" className="text-sm font-semibold hover:text-primary transition-colors ml-auto">Terms & Conditions →</Link>
        </div>
      </main>

      <footer className="border-t py-8" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--stat-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 text-center text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          © 2026 TutionHut Technologies Pvt. Ltd.
        </div>
      </footer>
    </div>
  );
}
