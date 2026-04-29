import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TutionHut - Manage Your Tuition Professionally',
  description: 'The #1 choice for Indian tutors to manage batches, attendance, and fees.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
