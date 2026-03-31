/**
 * GET /api/cron/onboarding-reminder
 * Schedule: daily 10:00 AM ET (15:00 UTC)
 *
 * Finds facilitators created 3 days ago with onboarding_step = 0
 * (i.e. they have never logged in or started onboarding).
 * Sends a single "Your Hub is ready" reminder email via Resend.
 * Logs to onboarding_reminder_log to prevent duplicate sends.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic  = 'force-dynamic';
export const maxDuration = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://wuwgbdjgsgtsmuctuhpt.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const RESEND_KEY   = process.env.RESEND_API_KEY ?? '';

interface FacilitatorRow {
  id:             string;
  email:          string;
  full_name:      string | null;
  created_at:     string;
  onboarding_step: number | null;
}

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey:        SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  return res.json();
}

async function sbPost(table: string, body: object) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: {
      apikey:          SERVICE_KEY,
      Authorization:   `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'resolution=ignore-duplicates', // UNIQUE constraint dedup
    },
    body: JSON.stringify(body),
  });
}

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Window: created between 3d 2h ago and 3d ago (generous band so cron skew doesn't miss anyone)
  const now        = new Date();
  const windowEnd  = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);           // 3 days ago
  const windowStart = new Date(now.getTime() - (3 * 24 + 2) * 60 * 60 * 1000);    // 3d 2h ago

  const startISO = windowStart.toISOString();
  const endISO   = windowEnd.toISOString();

  // Fetch candidates: created in window, never started onboarding
  const candidates: FacilitatorRow[] = await sbGet(
    `facilitator_profiles?select=id,email,full_name,created_at,onboarding_step` +
    `&created_at=gte.${startISO}&created_at=lte.${endISO}` +
    `&onboarding_step=eq.0`
  );

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no_candidates' });
  }

  // Check which ones have already been reminded (UNIQUE constraint handles concurrent runs)
  const alreadySent: Array<{ facilitator_id: string }> = await sbGet(
    `onboarding_reminder_log?facilitator_id=in.(${candidates.map(c => c.id).join(',')})&reminder_type=eq.day3&select=facilitator_id`
  );
  const sentIds = new Set(alreadySent.map(r => r.facilitator_id));
  const toRemind = candidates.filter(c => !sentIds.has(c.id));

  if (toRemind.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'all_already_reminded' });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const fac of toRemind) {
    const firstName = fac.full_name?.split(' ')[0] ?? 'there';

    try {
      // Send email
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    'Tri-Pillars LLC <ember@tripillarstudio.com>',
          to:      [fac.email],
          subject: 'Your Facilitator Hub is ready.',
          html: `
            <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1c3028;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Hi ${firstName},</p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
                You have been added as a Live and Grieve™ facilitator.
                Your Hub is ready and your pre-training preparation is waiting.
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;">
                Log in at
                <a href="https://www.tripillarstudio.com/login/facilitator"
                   style="color:#B8942F;text-decoration:none;font-weight:600;">
                  tripillarstudio.com/login/facilitator
                </a>
                to get started.
              </p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
                If you have any questions before training day, reply to this email.
              </p>

              <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                Tri-Pillars™ LLC<br>
                <a href="https://www.tripillarstudio.com" style="color:#B8942F;text-decoration:none;">tripillarstudio.com</a>
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.text();
        errors.push(`${fac.email}: Resend error ${emailRes.status} — ${err.slice(0, 80)}`);
        continue;
      }

      // Log to prevent future duplicates
      await sbPost('onboarding_reminder_log', {
        facilitator_id: fac.id,
        reminder_type:  'day3',
      });

      sent++;
      console.log(`[onboarding-reminder] Sent day-3 reminder to ${fac.email} (${fac.id})`);

    } catch (e: any) {
      errors.push(`${fac.email}: ${e?.message ?? 'unknown error'}`);
    }
  }

  return NextResponse.json({ sent, candidates: candidates.length, reminded: toRemind.length, errors });
}
