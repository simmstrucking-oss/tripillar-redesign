/**
 * GET /api/cron/prospect-digest
 * Daily digest of prospect activity from the last 24 hours.
 * Emails Wayne only if there was activity — no email on quiet days.
 * Schedule: daily at 8 AM CT (13:00 UTC) — add to vercel.json
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml } from '@/lib/mailer';
import { verifyCronRequest } from '@/lib/cron-auth';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Page views in last 24h
    const { data: views } = await sb
      .from('prospect_activity')
      .select('prospect_code, created_at')
      .gte('created_at', since);

    // Call requests in last 24h
    const { data: callRequests } = await sb
      .from('prospect_call_requests')
      .select('org_name, contact_name, contact_email, created_at')
      .gte('created_at', since);

    const viewCount   = views?.length ?? 0;
    const callCount   = callRequests?.length ?? 0;

    // Unique codes viewed
    const uniqueCodes = [...new Set(views?.map(v => v.prospect_code) ?? [])];

    // No activity — skip email
    if (viewCount === 0 && callCount === 0) {
      return NextResponse.json({ sent: false, reason: 'no_activity' });
    }

    // Build email body
    const callRows = callRequests?.map(c => `
      <tr>
        <td style="padding:6px 12px 6px 0;">${c.org_name ?? '—'}</td>
        <td style="padding:6px 12px 6px 0;">${c.contact_name ?? '—'}</td>
        <td style="padding:6px 0;">${c.contact_email ?? '—'}</td>
      </tr>`).join('') ?? '';

    const bodyHtml = `
      <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;">
        Here's your prospect activity from the last 24 hours.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:12px 16px;background:#f2efe9;border-radius:6px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;color:#1c3028;">${viewCount}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Page Views</p>
          </td>
          <td style="width:16px;"></td>
          <td style="padding:12px 16px;background:#f2efe9;border-radius:6px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;color:#1c3028;">${uniqueCodes.length}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Unique Prospects</p>
          </td>
          <td style="width:16px;"></td>
          <td style="padding:12px 16px;background:${callCount > 0 ? '#FEF3C7' : '#f2efe9'};border-radius:6px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;color:${callCount > 0 ? '#B45309' : '#1c3028'};">${callCount}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Call Requests</p>
          </td>
        </tr>
      </table>

      ${callCount > 0 ? `
      <h2 style="font-size:15px;font-weight:600;color:#1c3028;margin:0 0 12px;">📞 Call Requests</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb;">
            <th style="text-align:left;padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Organization</th>
            <th style="text-align:left;padding:6px 12px 6px 0;color:#6b7280;font-weight:600;">Contact</th>
            <th style="text-align:left;padding:6px 0;color:#6b7280;font-weight:600;">Email</th>
          </tr>
        </thead>
        <tbody>${callRows}</tbody>
      </table>
      ` : ''}

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        View full prospect activity in your
        <a href="https://www.tripillarstudio.com/admin/prospects" style="color:#B8942F;">admin dashboard</a>.
      </p>
    `;

    await sendMail({
      to: 'wayne@tripillarstudio.com',
      subject: `📊 Prospect activity — ${viewCount} view${viewCount !== 1 ? 's' : ''}, ${callCount} call request${callCount !== 1 ? 's' : ''}`,
      html: brandedHtml('Daily Prospect Digest', bodyHtml),
    });

    return NextResponse.json({ sent: true, views: viewCount, calls: callCount });

  } catch (err) {
    console.error('[prospect-digest] Error:', err);
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
  }
}
