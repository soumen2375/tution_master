import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TutionHut - Manage Your Tuition Professionally',
  description: 'The #1 choice for Indian tutors to manage batches, attendance, and fees.',
  keywords: ['tuition management', 'Indian tutors', 'batch management', 'attendance tracker', 'fee management'],
  openGraph: {
    title: 'TutionHut',
    description: 'Manage Your Tuition Like a Professional',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <I18nProvider>
            {children}
            <Toaster position="top-right" richColors />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
