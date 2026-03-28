/**
 * GET /api/cron/annual
 * Schedule: January 1 at 9 AM ET (14:00 UTC)
 * Generates Annual Impact Report PDF, stores in Supabase Storage, emails Wayne.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml } from '@/lib/mailer';
import { verifyCronRequest } from '@/lib/cron-auth';

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url    = new URL(req.url);
  const yParam = url.searchParams.get('year');

  const now = new Date();
  // Report covers the previous calendar year
  const reportYear = yParam ? parseInt(yParam) : now.getFullYear() - 1;
  const startISO   = `${reportYear}-01-01`;
  const endISO     = `${reportYear}-12-31`;
  const label      = `${reportYear} Annual Impact Report`;

  const sb   = getSupabaseServer();
  const now2 = new Date().toISOString();

  let errorMsg: string | null = null;

  try {
    // Generate Annual PDF
    const base = process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const genRes = await fetch(`${base}/api/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET ?? '',
      },
      body: JSON.stringify({
        type: 'annual',
        year: reportYear,
        force: true,
      }),
    });

    const genData = await genRes.json();
    if (!genRes.ok || !genData.ok) {
      throw new Error(`Annual PDF generation failed: ${genData.error ?? genRes.status}`);
    }

    const pdfUrl: string  = genData.url;
    const filePath: string = genData.path ?? `reports/annual/${reportYear}.pdf`;

    // Pull quick program-wide summary numbers for email context
    const [
      { data: allCompleted },
      { data: activeFacs },
      { data: activeOrgs },
    ] = await Promise.all([
      sb.from('cohorts').select('id').eq('status', 'completed'),
      sb.from('facilitator_profiles').select('id').eq('cert_status', 'active'),
      sb.from('organizations').select('id').eq('status', 'active'),
    ]);

    const completedIds = (allCompleted ?? []).map(c => c.id);
    let totalServed = 0;
    if (completedIds.length > 0) {
      const { data: outcomes } = await sb
        .from('cohort_outcomes')
        .select('post_participant_count')
        .in('cohort_id', completedIds)
        .not('post_participant_count', 'is', null);
      totalServed = (outcomes ?? []).reduce((s, o) => s + (o.post_participant_count ?? 0), 0);
    }

    // Email body
    const bodyHtml = `
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
        Your <strong>${label}</strong> is ready for review.
      </p>

      <div style="margin:0 0 24px;padding:20px;background:#f9f7f4;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:16px;color:#2D3142;">
          Live and Grieve™ ${reportYear} Annual Impact Report
        </p>
        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
          Year: ${startISO} — ${endISO}
        </p>
        <a href="${pdfUrl}"
           style="display:inline-block;background:#2D3142;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:6px;text-decoration:none;">
          ↓ Download Annual Report PDF
        </a>
      </div>

      <h3 style="font-family:Georgia,serif;font-size:15px;color:#2D3142;margin:0 0 10px;">Program Summary (All-Time)</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;font-size:13px;">
        ${[
          ['Participants Served (All-Time)',   totalServed],
          ['Cohorts Completed (All-Time)',     (allCompleted ?? []).length],
          ['Active Facilitators',             (activeFacs ?? []).length],
          ['Licensed Organizations',          (activeOrgs ?? []).length],
        ].map(([label, val], i) => `
          <tr style="background:${i % 2 === 0 ? '#f9f7f4' : '#ffffff'};">
            <td style="padding:7px 12px;color:#4a5568;">${label}</td>
            <td style="padding:7px 12px;font-weight:600;color:#2D3142;text-align:right;">${val}</td>
          </tr>
        `).join('')}
      </table>

      <p style="font-size:12px;color:#9ca3af;">
        This link expires in 24 hours. You can regenerate the report anytime from the
        <a href="https://www.tripillarstudio.com/admin/dashboard" style="color:#B8942F;">admin dashboard</a>.
      </p>
    `;

    const subject = `Live and Grieve™ ${reportYear} Annual Impact Report — Ready for Review`;
    await sendMail({
      to: 'wayne@tripillarstudio.com',
      subject,
      html: brandedHtml(subject, bodyHtml),
    });

    // Log to report_log
    await sb.from('report_log').insert({
      report_type: 'annual',
      report_period: `${startISO}/${endISO}`,
      generated_by_user_id: null,
      generated_for_entity: 'program',
      file_path: filePath,
      created_at: now2,
    });

    return NextResponse.json({
      ok: true,
      year: reportYear,
      pdf_url: pdfUrl,
      file_path: filePath,
      total_served: totalServed,
      cohorts_completed: (allCompleted ?? []).length,
      active_facilitators: (activeFacs ?? []).length,
    });

  } catch (err) {
    errorMsg = String(err);
    try {
      await sendMail({
        to: 'wayne@tripillarstudio.com',
        subject: `⚠️ Annual Cron Failed — ${reportYear} — Live and Grieve™`,
        html: brandedHtml('Annual Cron Error', `
          <p style="color:#dc2626;font-weight:600;">The ${reportYear} annual report cron job failed.</p>
          <pre style="background:#fef2f2;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">${errorMsg}</pre>
        `),
      });
    } catch { /* swallow */ }
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
