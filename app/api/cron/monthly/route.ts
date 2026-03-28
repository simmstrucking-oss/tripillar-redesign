/**
 * GET /api/cron/monthly
 * Schedule: 1st of each month 7 AM ET (12:00 UTC)
 * Compiles monthly metrics, stores snapshot in metrics_cache, emails Wayne.
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
  // Report covers the previous calendar month
  const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd   = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0).toISOString().split('T')[0];
  const monthLabel = reportDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthKey   = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;

  let errorMsg: string | null = null;

  try {
    // Active cohorts during month
    const { data: activeCohorts } = await sb
      .from('cohorts')
      .select('id, book_number, status, participant_count, facilitator_id')
      .or(`and(start_date.lte.${monthEnd},end_date.gte.${monthStart}),and(start_date.lte.${monthEnd},status.eq.active)`);
    const activeCount = (activeCohorts ?? []).length;

    // Cohorts completed this month
    const { data: completedCohorts } = await sb
      .from('cohorts')
      .select('id')
      .eq('status', 'completed')
      .gte('end_date', monthStart)
      .lte('end_date', monthEnd);
    const completedThisMonth = (completedCohorts ?? []).length;

    // Sessions logged this month
    const { data: monthLogs } = await sb
      .from('session_logs')
      .select('cohort_id, participants_attended, critical_incident, session_date')
      .gte('session_date', monthStart)
      .lte('session_date', monthEnd);
    const logsCount       = (monthLogs ?? []).length;
    const totalAttendance = (monthLogs ?? []).reduce((s, l) => s + (l.participants_attended ?? 0), 0);
    const incidents       = (monthLogs ?? []).filter(l => l.critical_incident).length;

    // Facilitators active (total program-wide)
    const { data: allFacs } = await sb
      .from('facilitator_profiles')
      .select('id, cert_status');
    const activeFacs = (allFacs ?? []).filter(f => f.cert_status === 'active').length;
    const totalFacs  = (allFacs ?? []).length;

    // New facilitators this month
    const { data: newFacs } = await sb
      .from('facilitator_profiles')
      .select('id')
      .gte('created_at', `${monthStart}T00:00:00`);
    const newFacsCount = (newFacs ?? []).length;

    // Organizations active
    const { data: allOrgs } = await sb
      .from('organizations')
      .select('id, status');
    const activeOrgs = (allOrgs ?? []).filter(o => o.status === 'active').length;

    // Solo Companion purchases this month
    const { data: purchases } = await sb
      .from('purchases')
      .select('access_type, amount_cents')
      .gte('created_at', `${monthStart}T00:00:00`)
      .lte('created_at', `${monthEnd}T23:59:59`);
    const soloCount   = (purchases ?? []).length;
    const soloRevenue = (purchases ?? []).reduce((s, p) => s + (p.amount_cents ?? 0), 0) / 100;

    // Codes redeemed this month
    const { data: codesRedeemed } = await sb
      .from('facilitator_codes')
      .select('id')
      .eq('redeemed', true)
      .gte('redeemed_at', `${monthStart}T00:00:00`);
    const codesCount = (codesRedeemed ?? []).length;

    // Program-wide totals (for public metrics refresh)
    const { data: allCompleted } = await sb
      .from('cohorts')
      .select('id')
      .eq('status', 'completed');
    const completedIds = (allCompleted ?? []).map(c => c.id);
    let totalParticipantsServed = 0;
    if (completedIds.length > 0) {
      const { data: outcomes } = await sb
        .from('cohort_outcomes')
        .select('post_participant_count')
        .in('cohort_id', completedIds)
        .not('post_participant_count', 'is', null);
      totalParticipantsServed = (outcomes ?? []).reduce((s, o) => s + (o.post_participant_count ?? 0), 0);
    }

    // Store monthly snapshot in metrics_cache with month-keyed keys
    const snapshotNow = new Date().toISOString();
    const snapshotEntries: Record<string, string> = {
      [`monthly_${monthKey}_participants_served`]:    String(totalParticipantsServed),
      [`monthly_${monthKey}_cohorts_active`]:          String(activeCount),
      [`monthly_${monthKey}_cohorts_completed`]:       String(completedThisMonth),
      [`monthly_${monthKey}_sessions_logged`]:         String(logsCount),
      [`monthly_${monthKey}_total_attendance`]:        String(totalAttendance),
      [`monthly_${monthKey}_facilitators_active`]:     String(activeFacs),
      [`monthly_${monthKey}_solo_purchases`]:          String(soloCount),
      // Also refresh rolling program totals
      participants_served:    String(totalParticipantsServed),
      cohorts_completed:      String((allCompleted ?? []).length),
      facilitators_certified: String(activeFacs),
      organizations_licensed: String(activeOrgs),
    };
    await Promise.all(
      Object.entries(snapshotEntries).map(([key, value]) =>
        sb.from('metrics_cache').upsert(
          { key, value, updated_at: snapshotNow },
          { onConflict: 'key' }
        )
      )
    );

    // Email body
    const bodyHtml = `
      <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">Monthly report for <strong>${monthLabel}</strong></p>

      <h3 style="font-family:Georgia,serif;font-size:15px;color:#2D3142;margin:0 0 10px;">Facilitated Program</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        ${[
          ['Active Cohorts',          activeCount],
          ['Cohorts Completed',        completedThisMonth],
          ['Sessions Logged',          logsCount],
          ['Total Session Attendances',totalAttendance],
          ['Critical Incidents',       incidents],
          ['New Facilitators',         newFacsCount],
          ['Total Active Facilitators',activeFacs],
          ['Total Facilitators (all)', totalFacs],
          ['Active Organizations',     activeOrgs],
          ['Codes Redeemed',           codesCount],
        ].map(([label, val], i) => `
          <tr style="background:${i % 2 === 0 ? '#f9f7f4' : '#ffffff'};">
            <td style="padding:7px 12px;color:#4a5568;">${label}</td>
            <td style="padding:7px 12px;font-weight:600;color:#2D3142;text-align:right;">${val}</td>
          </tr>
        `).join('')}
      </table>

      <h3 style="font-family:Georgia,serif;font-size:15px;color:#2D3142;margin:0 0 10px;">Solo Companion</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <tr style="background:#f9f7f4;">
          <td style="padding:7px 12px;color:#4a5568;">New Purchases</td>
          <td style="padding:7px 12px;font-weight:600;color:#2D3142;text-align:right;">${soloCount}</td>
        </tr>
        <tr>
          <td style="padding:7px 12px;color:#4a5568;">Revenue (Solo)</td>
          <td style="padding:7px 12px;font-weight:600;color:#16a34a;text-align:right;">$${soloRevenue.toFixed(2)}</td>
        </tr>
      </table>

      <h3 style="font-family:Georgia,serif;font-size:15px;color:#2D3142;margin:0 0 10px;">Program Totals (All-Time as of ${monthLabel})</h3>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;font-size:13px;">
        ${[
          ['Participants Served (All-Time)', totalParticipantsServed],
          ['Cohorts Completed (All-Time)',   (allCompleted ?? []).length],
          ['Active Facilitators',            activeFacs],
          ['Licensed Organizations',         activeOrgs],
        ].map(([label, val], i) => `
          <tr style="background:${i % 2 === 0 ? '#f9f7f4' : '#ffffff'};">
            <td style="padding:7px 12px;color:#4a5568;">${label}</td>
            <td style="padding:7px 12px;font-weight:600;color:#2D3142;text-align:right;">${val}</td>
          </tr>
        `).join('')}
      </table>

      ${incidents > 0 ? `<div style="margin-bottom:20px;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
        <strong style="color:#dc2626;">⚠️ ${incidents} Critical Incident${incidents !== 1 ? 's' : ''}</strong>
        <p style="margin:4px 0 0;font-size:12px;color:#7f1d1d;">Review session logs for sessions marked with critical incidents this month.</p>
      </div>` : ''}

      <div style="padding:14px 18px;background:#f9f7f4;border-left:3px solid #B8942F;border-radius:0 6px 6px 0;">
        <a href="https://www.tripillarstudio.com/admin/dashboard"
           style="color:#B8942F;font-size:13px;font-weight:600;text-decoration:none;">
          → View Full Dashboard
        </a>
      </div>
    `;

    const subject = `Live and Grieve™ Monthly Report — ${monthLabel}`;
    await sendMail({
      to: 'wayne@tripillarstudio.com',
      subject,
      html: brandedHtml(subject, bodyHtml),
    });

    // Log to report_log
    await sb.from('report_log').insert({
      report_type: 'monthly_metrics',
      report_period: `${monthStart}/${monthEnd}`,
      generated_by_user_id: null,
      generated_for_entity: 'program',
      file_path: null,
      created_at: snapshotNow,
    });

    return NextResponse.json({
      ok: true,
      period: monthLabel,
      active_cohorts: activeCount,
      sessions_logged: logsCount,
      new_facilitators: newFacsCount,
      solo_purchases: soloCount,
      snapshot_keys_written: Object.keys(snapshotEntries).length,
    });

  } catch (err) {
    errorMsg = String(err);
    try {
      await sendMail({
        to: 'wayne@tripillarstudio.com',
        subject: '⚠️ Monthly Cron Failed — Live and Grieve™',
        html: brandedHtml('Monthly Cron Error', `
          <p style="color:#dc2626;font-weight:600;">The monthly report cron job failed.</p>
          <pre style="background:#fef2f2;padding:12px;border-radius:6px;font-size:12px;overflow-x:auto;">${errorMsg}</pre>
        `),
      });
    } catch { /* swallow */ }
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
