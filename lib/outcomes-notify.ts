/**
 * lib/outcomes-notify.ts
 * Sends Wayne an email on every participant outcome form submission.
 * Called from each /api/outcomes/* route after a successful upsert.
 */

import { sendMail, brandedHtml, REPORT_RECIPIENT } from './mailer';

const SCORE_LABELS: Record<string, string> = {
  emotions:            'Acknowledge & name grief emotions',
  disruption:          'Grief disruption to daily functioning',
  isolation:           'Isolation',
  meaning:             'Meaning and purpose',
  selfcare:            'Self-care (sleep, eating, basic needs)',
  manageability:       'Manageability of grief',
  connection:          'Group connection',
  helpful:             'Program was helpful',
  safety:              'Felt safe in the group',
  facilitatorSupport:  'Facilitator support',
};

function scoreRow(label: string, value: number | null | undefined): string {
  if (value == null) return '';
  const bar = Math.round((value / 10) * 10);
  const color = value >= 7 ? '#2a7a4b' : value >= 4 ? '#B8942F' : '#c0392b';
  return `<tr>
    <td style="padding:4px 0;font-size:13px;color:#2D3142;">${label}</td>
    <td style="padding:4px 8px;font-size:13px;font-weight:700;color:${color};">${value}/10</td>
    <td style="padding:4px 0;">
      <div style="width:${bar * 8}px;height:6px;background:${color};border-radius:3px;"></div>
    </td>
  </tr>`;
}

function openTextBlock(label: string, text: string | null | undefined): string {
  if (!text) return '';
  return `<div style="margin:12px 0;">
    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#a0948a;">${label}</p>
    <p style="margin:0;font-size:13px;color:#2D3142;background:#f9f7f4;padding:10px 12px;border-left:3px solid #B8942F;border-radius:0 4px 4px 0;">${text}</p>
  </div>`;
}

export type Phase = 'Pre-Program' | 'Mid-Program' | 'Post-Program' | '90-Day Follow-Up';

export interface NotifyPayload {
  phase: Phase;
  cohortId: string;
  cohortLabel?: string;   // e.g. "Book 1 — started 2026-05-19"
  email: string;
  scores?: Record<string, number | null>;
  openText?: Record<string, string | null>;   // label → value
  extras?: Record<string, string | number | boolean | null>; // misc fields (sessions attended, consent, etc.)
}

export async function notifyOutcomeSubmission(payload: NotifyPayload): Promise<void> {
  const { phase, cohortLabel, email, scores, openText, extras } = payload;

  const scoresHtml = scores
    ? `<table style="border-collapse:collapse;margin:8px 0 16px;">
        ${Object.entries(scores).map(([k, v]) => scoreRow(SCORE_LABELS[k] ?? k, v)).join('')}
      </table>`
    : '';

  const openHtml = openText
    ? Object.entries(openText).map(([label, val]) => openTextBlock(label, val)).join('')
    : '';

  const extrasHtml = extras
    ? Object.entries(extras)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `<p style="margin:2px 0;font-size:12px;color:#5a6a60;"><strong>${k}:</strong> ${v}</p>`)
        .join('')
    : '';

  const body = `
    <div style="margin-bottom:16px;">
      <span style="display:inline-block;background:#1c3028;color:#B8942F;font-size:11px;font-weight:700;
        text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:12px;">${phase}</span>
    </div>
    <p style="margin:0 0 4px;font-size:13px;color:#5a6a60;"><strong>Cohort:</strong> ${cohortLabel ?? payload.cohortId}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#5a6a60;"><strong>Participant:</strong> ${email}</p>

    ${scoresHtml}
    ${openHtml}
    ${extrasHtml}

    <p style="margin:20px 0 0;font-size:11px;color:#a0948a;">
      Submitted at ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })} CT
    </p>
  `;

  await sendMail({
    to: REPORT_RECIPIENT,
    subject: `Live and Grieve™ — ${phase} Submission`,
    html: brandedHtml(`${phase} Outcome Form Submitted`, body),
  });
}
