import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const ROUTES_TO_CHECK = [
  'https://www.tripillarstudio.com/',
  'https://www.tripillarstudio.com/program/adult',
  'https://www.tripillarstudio.com/facilitators',
  'https://www.tripillarstudio.com/login/facilitator',
  'https://www.tripillarstudio.com/api/internal/status',
  'https://solo.tripillarstudio.com/',
  'https://www.tripillarstudio.com/free-guide',
  'https://www.tripillarstudio.com/contact',
];

async function checkRoute(url: string): Promise<{ url: string; ok: boolean; status: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const headers: Record<string, string> = {};
    if (url.includes('/api/internal/status')) {
      headers['x-admin-secret'] = process.env.ADMIN_SECRET ?? '';
    }
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return { url, ok: res.status === 200, status: res.status };
  } catch {
    return { url, ok: false, status: 0 };
  }
}

export async function GET(req: NextRequest) {
  // Auth: x-admin-secret header OR ?secret= query param
  const adminSecret = process.env.ADMIN_SECRET ?? '';
  const cronSecret = process.env.CRON_SECRET ?? '';
  const headerSecret = req.headers.get('x-admin-secret');
  const querySecret = req.nextUrl.searchParams.get('secret');

  const authorized =
    (headerSecret && headerSecret === adminSecret) ||
    (querySecret && querySecret === cronSecret);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await Promise.all(ROUTES_TO_CHECK.map(checkRoute));
  const failures = results.filter((r) => !r.ok);

  if (failures.length === 0) {
    return NextResponse.json({
      status: 'healthy',
      checked: results.length,
      failed: 0,
    });
  }

  // Send alert email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const timestamp = new Date().toISOString();
    const failureRows = failures
      .map(
        (f) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #ddd;font-family:monospace;font-size:13px;">${f.url}</td><td style="padding:8px 12px;border-bottom:1px solid #ddd;color:#DC2626;font-weight:600;">${f.status === 0 ? 'Timeout/Error' : f.status}</td></tr>`
      )
      .join('');

    await resend.emails.send({
      from: 'ember@tripillarstudio.com',
      to: 'wayne@tripillarstudio.com',
      subject: '⚠️ tripillarstudio.com — Route Health Alert',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1a2744;margin-bottom:4px;">Route Health Alert</h2>
          <p style="color:#6B7280;font-size:13px;margin-top:0;">${timestamp}</p>
          <p style="color:#1a2744;">${failures.length} of ${results.length} monitored routes failed their health check.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr style="background:#1a2744;color:#f5f0e8;">
              <th style="padding:8px 12px;text-align:left;">Route</th>
              <th style="padding:8px 12px;text-align:left;">Status</th>
            </tr></thead>
            <tbody>${failureRows}</tbody>
          </table>
          <p style="color:#DC2626;font-weight:600;">Immediate attention may be required.</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />
          <p style="color:#999;font-size:11px;">Sent by Tri-Pillars™ Health Monitor</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('Health check email failed:', emailErr);
  }

  return NextResponse.json({
    status: 'degraded',
    checked: results.length,
    failed: failures.length,
    failures: failures.map((f) => ({ url: f.url, status: f.status })),
  });
}
