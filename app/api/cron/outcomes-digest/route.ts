/**
 * GET /api/cron/outcomes-digest
 * Schedule: daily 8:00 AM CT (13:00 UTC)
 *
 * Emails Wayne a summary of all outcome form submissions from the past 24 hours,
 * grouped by phase, with per-cohort counts and aggregate averages.
 * Skips silently if no new submissions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml, REPORT_RECIPIENT } from '@/lib/mailer';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function avg(rows: Record<string, unknown>[], field: string): string {
  const vals = rows.map(r => r[field]).filter((v): v is number => typeof v === 'number');
  if (!vals.length) return '—';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function scoreTable(rows: Record<string, unknown>[], fields: { key: string; label: string }[]): string {
  if (!rows.length) return '';
  return `<table style="border-collapse:collapse;margin:8px 0 12px;width:100%;">
    <tr style="border-bottom:1px solid #ece8e1;">
      <th style="text-align:left;font-size:11px;color:#a0948a;padding:4px 0;text-transform:uppercase;letter-spacing:0.05em;">Measure</th>
      <th style="text-align:center;font-size:11px;color:#a0948a;padding:4px 8px;text-transform:uppercase;letter-spacing:0.05em;">Avg</th>
    </tr>
    ${fields.map(f => `<tr>
      <td style="font-size:13px;color:#2D3142;padding:3px 0;">${f.label}</td>
      <td style="font-size:13px;font-weight:700;color:#1c3028;text-align:center;padding:3px 8px;">${avg(rows, f.key)}</td>
    </tr>`).join('')}
  </table>`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch all new submissions in past 24h across all 4 tables
  const [preRes, midRes, postRes, followupRes] = await Promise.all([
    sb.from('outcomes_pre').select('*').gte('submitted_at', since),
    sb.from('outcomes_mid').select('*').gte('submitted_at', since),
    sb.from('outcomes_post').select('*').gte('submitted_at', since),
    sb.from('outcomes_followup').select('*').gte('submitted_at', since),
  ]);

  const pre      = (preRes.data ?? []) as Record<string, unknown>[];
  const mid      = (midRes.data ?? []) as Record<string, unknown>[];
  const post     = (postRes.data ?? []) as Record<string, unknown>[];
  const followup = (followupRes.data ?? []) as Record<string, unknown>[];

  const total = pre.length + mid.length + post.length + followup.length;
  if (total === 0) {
    return NextResponse.json({ ok: true, message: 'No new outcome submissions in past 24h' });
  }

  // Get cohort labels for any cohort IDs we've seen
  const cohortIds = [...new Set([...pre, ...mid, ...post, ...followup].map(r => r.cohort_id as string))];
  const { data: cohortRows } = await sb.from('cohorts').select('id, book_number, start_date').in('id', cohortIds);
  const cohortLabel = (id: string) => {
    const c = (cohortRows ?? []).find(r => r.id === id);
    return c ? `Book ${c.book_number} — started ${c.start_date}` : id;
  };

  function phaseSection(
    label: string,
    rows: Record<string, unknown>[],
    scoreFields: { key: string; label: string }[],
    openFields: { key: string; label: string }[]
  ): string {
    if (!rows.length) return '';

    const byCohort: Record<string, Record<string, unknown>[]> = {};
    for (const r of rows) {
      const cid = r.cohort_id as string;
      if (!byCohort[cid]) byCohort[cid] = [];
      byCohort[cid].push(r);
    }

    const cohortBlocks = Object.entries(byCohort).map(([cid, crows]) => {
      const openHtml = openFields
        .flatMap(f => crows.map(r => r[f.key] as string | null).filter(Boolean))
        .map(t => `<li style="font-size:12px;color:#2D3142;margin:4px 0;line-height:1.5;">${t}</li>`)
        .join('');

      return `<div style="margin-bottom:12px;">
        <p style="margin:0 0 6px;font-size:12px;color:#5a6a60;"><strong>${cohortLabel(cid)}</strong> — ${crows.length} submission${crows.length !== 1 ? 's' : ''}</p>
        ${scoreTable(crows, scoreFields)}
        ${openHtml ? `<ul style="margin:4px 0;padding-left:16px;">${openHtml}</ul>` : ''}
      </div>`;
    }).join('');

    return `<div style="margin:20px 0 8px;padding:16px;background:#f9f7f4;border-radius:8px;border-left:4px solid #1c3028;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1c3028;text-transform:uppercase;letter-spacing:0.06em;">
        ${label} <span style="font-weight:400;color:#a0948a;">(${rows.length} new)</span>
      </p>
      ${cohortBlocks}
    </div>`;
  }

  const bodyHtml = `
    <p style="font-size:14px;color:#2D3142;margin:0 0 20px;">
      <strong>${total} new submission${total !== 1 ? 's' : ''}</strong> across all outcome phases in the past 24 hours.
    </p>

    ${phaseSection('Pre-Program', pre, [
      { key: 'score_emotions',     label: 'Emotions' },
      { key: 'score_disruption',   label: 'Disruption' },
      { key: 'score_isolation',    label: 'Isolation' },
      { key: 'score_meaning',      label: 'Meaning' },
      { key: 'score_selfcare',     label: 'Self-care' },
      { key: 'score_manageability', label: 'Manageability' },
    ], [{ key: 'open_hope', label: 'What they hope to gain' }])}

    ${phaseSection('Mid-Program', mid, [
      { key: 'score_emotions',     label: 'Emotions' },
      { key: 'score_manageability', label: 'Manageability' },
      { key: 'score_connection',   label: 'Group connection' },
    ], [{ key: 'open_surprise', label: 'Mid-program shift' }])}

    ${phaseSection('Post-Program', post, [
      { key: 'score_emotions',            label: 'Emotions' },
      { key: 'score_disruption',          label: 'Disruption' },
      { key: 'score_isolation',           label: 'Isolation' },
      { key: 'score_meaning',             label: 'Meaning' },
      { key: 'score_selfcare',            label: 'Self-care' },
      { key: 'score_manageability',       label: 'Manageability' },
      { key: 'score_program_helpful',     label: 'Program helpful' },
      { key: 'score_safety',              label: 'Felt safe' },
      { key: 'score_facilitator_support', label: 'Facilitator support' },
    ], [
      { key: 'open_change',    label: 'What changed' },
      { key: 'open_recommend', label: 'Would recommend' },
      { key: 'open_improve',   label: 'How to improve' },
    ])}

    ${phaseSection('90-Day Follow-Up', followup, [
      { key: 'score_manageability', label: 'Manageability' },
    ], [{ key: 'open_reflection', label: '90-day reflection' }])}

    <p style="margin:24px 0 0;font-size:11px;color:#a0948a;">
      View full data in the Outcomes tab of the facilitator hub dashboard.
    </p>
  `;

  await sendMail({
    to: REPORT_RECIPIENT,
    subject: `Live and Grieve™ — Daily Outcomes Digest (${total} new)`,
    html: brandedHtml('Daily Outcomes Digest', bodyHtml),
  });

  // Log to report_log
  await sb.from('report_log').insert({
    report_type: 'outcomes-digest',
    generated_at: new Date().toISOString(),
    summary: `${total} new submissions: ${pre.length} pre, ${mid.length} mid, ${post.length} post, ${followup.length} followup`,
  }).catch(() => {/* non-fatal */});

  return NextResponse.json({ ok: true, total, pre: pre.length, mid: mid.length, post: post.length, followup: followup.length });
}
