import { Link } from 'react-router-dom';
import { GraduationCap, Shield } from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing or using TutionHut ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform. These terms apply to all visitors, teachers, students, and other users.`,
    },
    {
      title: '2. Description of Service',
      content: `TutionHut provides a digital tuition management platform that allows teachers to manage batches, record attendance, track fee payments, share study materials, and communicate with students. Students can access their academic records, fee status, and study content uploaded by their teachers.`,
    },
    {
      title: '3. User Accounts',
      content: `You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. TutionHut is not liable for any loss resulting from unauthorized use of your account. Accounts are non-transferable.`,
    },
    {
      title: '4. Subscription and Payments',
      content: `Teacher subscriptions are billed monthly or annually as chosen. Payments are processed securely via Razorpay. Subscriptions auto-renew unless cancelled 24 hours before the renewal date. No refunds are offered for partial months. Free plan users can upgrade or downgrade at any time. Students access the platform free of charge.`,
    },
    {
      title: '5. Acceptable Use',
      content: `You agree not to: (a) upload unlawful, harmful, or copyrighted content without authorization; (b) attempt to disrupt or compromise the security of the platform; (c) impersonate another person or entity; (d) use the platform for commercial spam or bulk messaging; (e) scrape, reverse-engineer, or copy platform features without written permission.`,
    },
    {
      title: '6. Content Ownership',
      content: `Teachers retain full ownership of all study materials, notes, and content they upload. By uploading, you grant TutionHut a non-exclusive, worldwide, royalty-free license to store and deliver that content to enrolled students. TutionHut does not claim ownership of your content.`,
    },
    {
      title: '7. Privacy',
      content: `Your use of the Platform is also governed by our Privacy Policy. We collect only the data necessary to operate the service and never sell your personal data to third parties.`,
    },
    {
      title: '8. Termination',
      content: `TutionHut reserves the right to suspend or terminate any account that violates these Terms. Upon termination, your data will be retained for 30 days before permanent deletion, giving you time to export your records.`,
    },
    {
      title: '9. Limitation of Liability',
      content: `TutionHut is provided "as is". We do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, TutionHut shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.`,
    },
    {
      title: '10. Governing Law',
      content: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.`,
    },
    {
      title: '11. Changes to Terms',
      content: `We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Terms. We will notify registered users of material changes via email.`,
    },
    {
      title: '12. Contact',
      content: `For any questions about these Terms, please contact us at: legal@tutionhut.in or write to: TutionHut Technologies Pvt. Ltd., Bengaluru, Karnataka 560001, India.`,
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
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">Terms & Conditions</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                Last updated: 30 April 2026 · Effective immediately
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Please read these terms carefully.</strong> By using TutionHut, you agree to these terms. If you are under 18, you must have parental/guardian consent.
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="mb-10 p-5 rounded-2xl border" style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--card-border)' }}>
          <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted-foreground)' }}>Contents</h2>
          <ul className="space-y-1">
            {sections.map((s, i) => (
              <li key={i}>
                <a href={`#section-${i}`} className="text-sm hover:text-primary transition-colors">{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={i} id={`section-${i}`}>
              <h2 className="text-xl font-bold mb-3 text-primary">{s.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{s.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row gap-4" style={{ borderColor: 'var(--card-border)' }}>
          <Link to="/contact" className="text-sm font-semibold hover:text-primary transition-colors">Questions? Contact Us →</Link>
          <Link to="/privacy" className="text-sm font-semibold hover:text-primary transition-colors ml-auto">Privacy Policy →</Link>
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
