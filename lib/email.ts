import { Resend } from 'resend';

// Use environment variable, fallback to a dummy or error if missing.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  if (!resend) {
    console.warn(`[EMAIL MOCK] Missing RESEND_API_KEY. Would have sent email to ${to}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Body: ${text || html}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: 'Job Machine <no-reply@resend.dev>', // Change to verified domain when live
      to,
      subject,
      text: text || '',
      html: html || '',
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
