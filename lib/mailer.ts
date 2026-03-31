/**
 * lib/mailer.ts — shared email utility using ember@tripillarstudio.com SMTP
 * Namecheap Private Email: mail.privateemail.com:465 (TLS/SSL)
 */
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'ember@tripillarstudio.com',
    pass: process.env.EMBER_EMAIL_PASSWORD,
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!process.env.EMBER_EMAIL_PASSWORD) {
    throw new Error('EMBER_EMAIL_PASSWORD env var is not set');
  }
  await transporter.sendMail({
    // Namecheap SMTP requires From = authenticated user (ember@).
    // Display name shows "Live and Grieve™ Reports"; Reply-To routes to Wayne.
    from: '"Live and Grieve™ Reports" <ember@tripillarstudio.com>',
    replyTo: 'wayne@tripillarstudio.com',
    ...opts,
  });
}

/** Default recipient for all program reports */
export const REPORT_RECIPIENT = 'wayne@tripillarstudio.com';

/** Standard branded email wrapper */
export function brandedHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:#1c3028;padding:28px 36px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#B8942F;font-weight:bold;">Tri-Pillars™ LLC</p>
            <p style="margin:6px 0 0;font-size:12px;color:#a8bfb4;text-transform:uppercase;letter-spacing:0.08em;">Live and Grieve™ Program</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:20px;color:#2D3142;">${title}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #ece8e1;">
            <p style="margin:0;font-size:11px;color:#a0948a;line-height:1.6;">
              Tri-Pillars™ LLC · tripillarstudio.com<br>
              This is an automated report from your Live and Grieve™ program dashboard.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
