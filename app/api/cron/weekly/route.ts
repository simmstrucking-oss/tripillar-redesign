/**
 * GET /api/cron/weekly
 * Schedule: every Monday 6 AM ET (11:00 UTC)
 * Compiles weekly activity summary → emails Wayne.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml } from '@/lib/mailer';
import { verifyCronRequest } from '@/lib/cron-auth';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const weekStartISO = weekStart.toISOString().split('T')[0];
  const weekEndISO   = now.toISOString().split('T')[0];
  const dateLabel    = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  let errorMsg: string | null = null;

  try {
    // 1. Active cohorts
    const { data: activeCohorts } = await sb
      .from('cohorts')
      .select('id, book_number, facilitator_id, participant_count')
      .eq('status', 'active');
    const activeCount = (activeCohorts ?? []).length;

    // 2. Sessions logged this week
    const { data: weekLogs } = await sb
      .from('session_logs')
      .select('cohort_id, week_number, participants_attended, session_date, critical_incident')
      .gte('session_date', weekStartISO)
      .lte('session_date', weekEndISO);
    const logsCount = (weekLogs ?? []).length;
    const incidents = (weekLogs ?? []).filter(l => l.critical_incident);
    const newParticipants = (weekLogs ?? []).reduce((s, l) => s + (l.participants_attended ?? 0), 0);

    // 3. New facilitators provisioned this week
    const { data: newFacs } = await sb
      .from('facilitator_profiles')
      .select('full_name, email, cert_status')
      .gte('created_at', weekStart.toISOString());
    const newFacsCount = (newFacs ?? []).length;

    // 4. New organizations this week
    const { data: newOrgs } = await sb
      .from('organizations')
      .select('name')
      .gte('created_at', weekStart.toISOString());

    // 5. New Solo Companion purchases (purchases table)
    const { data: newPurchases } = await sb
      .from('purchases')
      .select('email, access_type, created_at')
      .gte('created_at', weekStart.toISOString());
    const purchaseCount = (newPurchases ?? []).length;

    // Build email
    const incidentRows = incidents.length > 0
      ? `<tr><td style="padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;" colspan="2">
          <strong style="color:#dc2626;">⚠️ Critical Incidents (${incidents.length})</strong><br>
          <span style="font-size:13px;color:#7f1d1d;">Review session logs for cohorts with critical incidents this week.</span>
        </td></tr>`
      : '';

    const newFacRows = (newFacs ?? []).length > 0
      ? (newFacs ?? []).map(f =>
          `<li style="margin:3px 0;font-size:13px;color:#4a5568;">${f.full_name} (${f.email}) — ${f.cert_status}</li>`
        ).join('')
      : '<li style="font-size:13px;color:#a0aec0;">None this week</li>';

    const newOrgRows = (newOrgs ?? []).length > 0
      ? (newOrgs ?? []).map(o => `<li style="margin:3px 0;font-size:13px;color:#4a5568;">${o.name}</li>`).join('')
      : '<li style="font-size:13px;color:#a0aec0;">None this week</li>';

    const bodyHtml = `
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Week of ${dateLabel}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:14px;text-align:center;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin-right:8px;">
            <div style="font-size:28px;font-weight:700;color:#0369a1;">${activeCount}</div>
            <div style="font-size:11px;color:#0369a1;text-transform:uppercase;letter-spacing:0.06em;">Active Cohorts</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:14px;text-align:center;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
            <div style="font-size:28px;font-weight:700;color:#16a34a;">${logsCount}</div>
            <div style="font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:0.06em;">Sessions Logged</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:14px;text-align:center;background:#fefce8;border:1px solid #fde68a;border-radius:6px;">
            <div style="font-size:28px;font-weight:700;color:#b45309;">${newParticipants}</div>
            <div style="font-size:11px;color:#b45309;text-transform:uppercase;letter-spacing:0.06em;">Attendances</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:14px;text-align:center;background:#fdf4ff;border:1px solid #e9d5ff;border-radius:6px;">
            <div style="font-size:28px;font-weight:700;color:#7c3aed;">${purchaseCount}</div>
            <div style="font-size:11px;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;">Solo Purchases</div>
          </td>
        </tr>
        ${incidentRows ? `<tr><td colspan="9" style="padding-top:12px;">${incidentRows}</td></tr>` : ''}
      </table>

      <h3 style="font-family:Georgia,serif;font-size:15px;color:#2D3142;margin:0 0 8px;">New Facilitators (${newFacsCount})</h3>
      <ul style="margin:0 0 20px;padding-left:18px;">${newFacRows}</ul>

      <h3 style="font-family:Georgia,serif;font-size:15px;color:#2D3142;margin:0 0 8px;">New Organizations (${(newOrgs ?? []).length})</h3>
      <ul style="margin:0 0 20px;padding-left:18px;">${newOrgRows}</ul>

      <div style="margin-top:24px;padding:14px 18px;background:#f9f7f4;border-left:3px solid #B8942F;border-radius:0 6px 6px 0;">
        <a href="https://www.tripillarstudio.com/admin/dashboard"
           style="color:#B8942F;font-size:13px;font-weight:600;text-decoration:none;">
          → View Full Dashboard
        </a>
      </div>
    `;

    const subject = `Live and Grieve™ Weekly Summary — ${dateLabel}`;
    await sendMail({
      to: 'wayne@tripillarstudio.com',
      subject,
      html: brandedHtml(subject, bodyHtml),
    });

    // Log to report_log
    await sb.from('report_log').insert({
      report_type: 'weekly_summary',
      report_period: `${weekStartISO}/${weekEndISO}`,
      generated_by_user_id: null,
      generated_for_entity: 'program',
      file_path: null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      period: `${weekStartISO}/${weekEndISO}`,
      active_cohorts: activeCount,
      sessions_logged: logsCount,
      critical_incidents: incidents.length,
      new_facilitators: newFacsCount,
      solo_purchases: purchaseCount,
    });

  } catch (err) {
    errorMsg = String(err);

    // Error notification email
    try {
      await sendMail({
        to: 'wayne@tripillarstudio.com',
        subject: '⚠️ Weekly Cron Failed — Live and Grieve™',
        html: brandedHtml('Weekly Cron Error', `
          <p style="color:#dc2626;font-weight:600;">The weekly summary cron job failed.</p>
          <pre style="background:#fef2f2;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">${errorMsg}</pre>
          <p style="color:#6b7280;font-size:13px;">Check Vercel function logs for details.</p>
        `),
      });
    } catch { /* swallow secondary failure */ }

    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
