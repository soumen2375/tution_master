import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn('Resend API key not set. Skipping email.');
    return;
  }
  
  try {
    const data = await resend.emails.send({
      from: 'TutionHut <notifications@tutionhut.com>',
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
