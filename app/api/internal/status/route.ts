import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

const COMPLETED_SESSIONS = [
  { session: 1,  date: '2026-03-27', summary: 'Solo Companion deployed to solo.tripillarstudio.com. Stripe payment gate live. End-to-end payment flow confirmed.' },
  { session: 2,  date: '2026-03-27', summary: 'Supabase integration. Stripe webhook (invoice.paid → purchases table + Kit). Installment auto-cancel after 3 payments.' },
  { session: 3,  date: '2026-03-27', summary: 'Two-option gate page ($24.99 one-time, $9.99×3 installment). auth.html with sign-in/create-account/continue-without.' },
  { session: 4,  date: '2026-03-28', summary: 'Facilitator Hub foundation: 5 Supabase tables, RLS, storage bucket facilitator-documents, /api/create-facilitator.' },
  { session: 5,  date: '2026-03-28', summary: '10 facilitator Kit sequences created. Hub auth middleware. /facilitators/login, /hub/dashboard, /org/dashboard.' },
  { session: 6,  date: '2026-03-28', summary: 'Admin panel /admin/facilitators: Facilitators tab (create/list/search/activate/expire/delete), Organizations tab.' },
  { session: 7,  date: '2026-03-28', summary: 'Codes tab in Hub. gate.html code redemption UI (LGS- prefix). redeem-code API. supplement-access.html.' },
  { session: 8,  date: '2026-03-28', summary: 'Admin code activity visibility. 15/15 E2E tests passed. Solo Companion four access states in index.html.' },
  { session: 9,  date: '2026-03-28', summary: 'Hub Data Entry UI. 5 reporting API endpoints. PDF generation (pdfkit AFM fix). /admin/dashboard lifetime view. /org/dashboard reporting. Hub Reports tab. 15/15 E2E passed.' },
  { session: 10, date: '2026-03-29', summary: 'Kit sequences + tags for website. Free Guide PDF + subscribe flow. Contact form (Resend). Solo Companion links. Memorial Wall. /start landing page. Cross-surface navigation. Main nav Solo Companion + Facilitator Login.' },
  { session: 11, date: '2026-03-29', summary: 'Debug audit (clean). Cache issue resolved (re-alias). /start page + cross-surface nav. Pricing locked: $24.99 one-time, $9.99×3 installment.' },
  { session: 12, date: '2026-03-29', summary: 'Critical Incident Report. Session Feedback. Facilitator Reflection Log (private RLS). Cohort Summary form. Document Library: 109 files in 3 buckets, Hub UI, /admin/documents, access logging.' },
  { session: 13, date: '2026-03-29', summary: 'Task 7: Facilitator onboarding checklist (7 items, Phase 1), orientation panel (Phase 2), digital signatures (Phase 3) — Code of Conduct, Cert Acknowledgment, Group Use License. DB: facilitator_signatures table + 6 onboarding columns on facilitator_profiles. Verification audit (8 checks). Fix 1: RESEND_API_KEY trailing newline removed; Resend DNS records identified for Namecheap. Fix 2: IP disclosure added to SignatureField.tsx. Fix 3: Status endpoint updated.' },
];

const LIVE_FEATURES = [
  { feature: 'Solo Companion app',                   url: 'https://solo.tripillarstudio.com',             date: '2026-03-27' },
  { feature: 'Stripe payment gate (one-time + installment)', url: 'https://solo.tripillarstudio.com/gate', date: '2026-03-27' },
  { feature: 'Stripe webhook (Supabase + Kit)',       url: '/api/webhook/stripe',                           date: '2026-03-27' },
  { feature: 'Solo Companion 7-day unlock logic',     url: 'https://solo.tripillarstudio.com',             date: '2026-03-28' },
  { feature: 'Access code redemption (LGS- prefix)',  url: '/api/redeem-code',                              date: '2026-03-28' },
  { feature: 'Facilitator Hub dashboard',             url: 'https://tripillarstudio.com/facilitators/hub', date: '2026-03-28' },
  { feature: 'Facilitator Hub document library',      url: '/facilitators/hub/dashboard (Documents tab)',   date: '2026-03-29' },
  { feature: 'Admin panel /admin/facilitators',       url: 'https://tripillarstudio.com/admin/facilitators',date: '2026-03-28' },
  { feature: 'Admin document library',               url: 'https://tripillarstudio.com/admin/documents',   date: '2026-03-29' },
  { feature: 'Admin dashboard /admin/dashboard',      url: 'https://tripillarstudio.com/admin/dashboard',  date: '2026-03-28' },
  { feature: 'Hub reporting (quarterly + annual PDFs)', url: '/facilitators/hub/dashboard (Reports tab)',  date: '2026-03-28' },
  { feature: 'Critical Incident Report form',         url: '/facilitators/hub/dashboard',                  date: '2026-03-29' },
  { feature: 'Session Feedback form + weekly digest', url: '/facilitators/hub/dashboard',                  date: '2026-03-29' },
  { feature: 'Facilitator Reflection Log (private)',  url: '/facilitators/hub/dashboard',                  date: '2026-03-29' },
  { feature: 'Cohort Summary + completion API',       url: '/facilitators/hub/dashboard',                  date: '2026-03-29' },
  { feature: 'Memorial Wall (approval via Supabase)', url: 'https://tripillarstudio.com/memorial',         date: '2026-03-29' },
  { feature: 'Free Guide page + subscribe flow',      url: 'https://tripillarstudio.com/free-guide',       date: '2026-03-29' },
  { feature: 'Contact form (Resend)',                 url: 'https://tripillarstudio.com/contact',          date: '2026-03-29' },
  { feature: '/start landing page',                  url: 'https://tripillarstudio.com/start',            date: '2026-03-29' },
  { feature: 'Document access logging',              url: 'document_access_log table',                     date: '2026-03-29' },
  { feature: 'Facilitator onboarding checklist (Phase 1 + 2)', url: '/facilitators/hub/dashboard',          date: '2026-03-29' },
  { feature: 'Digital signatures (Code of Conduct, Cert Ack, Group Use License)', url: '/api/hub/sign',    date: '2026-03-29' },
  { feature: 'Internal context/status/documents API', url: '/api/internal/*',                               date: '2026-03-29' },
];

const PENDING_TASKS = [
  { priority: 1, task: 'Kit sequences 2701221/2701223/2701225 — placeholder emails only, real copy not written' },
  { priority: 2, task: 'Kit test subscribers (ember-test-*) — bulk-delete from Kit dashboard' },
  { priority: 3, task: '/api/hub/consultation-requests — confirm if still needed or superseded' },
  { priority: 4, task: 'TM1-LP KDP upload — pending Wayne manual action via Browser Relay' },
  { priority: 5, task: 'TM3, TM4, CFRG1–4 KDP paperback editions — not started' },
];

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Live counts from Supabase
  let live_counts: Record<string, number> = {};
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const tables = ['facilitator_profiles', 'organizations', 'cohorts', 'purchases', 'memorial_entries'];
    const results = await Promise.all(
      tables.map(t => sb.from(t).select('*', { count: 'exact', head: true }))
    );
    tables.forEach((t, i) => {
      live_counts[t] = results[i].count ?? 0;
    });
  } catch (_) {
    live_counts = { error: -1 };
  }

  return NextResponse.json({
    last_session: COMPLETED_SESSIONS[COMPLETED_SESSIONS.length - 1],
    completed_sessions: COMPLETED_SESSIONS,
    live_features: LIVE_FEATURES,
    pending_tasks: PENDING_TASKS,
    live_counts,
    generated_at: new Date().toISOString(),
  }, { status: 200 });
}
