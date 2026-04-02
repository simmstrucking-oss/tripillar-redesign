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
  { session: 10, date: '2026-03-29', summary: 'Kit sequences + tags for website. Free Guide PDF + subscribe flow. Contact form (Resend). Solo Companion links. Memorial Wall. /start landing page. Cross-surface navigation.' },
  { session: 11, date: '2026-03-29', summary: 'Debug audit (clean). Cache issue resolved. /start page + cross-surface nav. Pricing locked: $24.99 one-time, $9.99×3 installment.' },
  { session: 12, date: '2026-03-29', summary: 'Critical Incident Report. Session Feedback. Facilitator Reflection Log (private RLS). Cohort Summary form. Document Library: 109 files in 3 buckets, Hub UI, /admin/documents, access logging.' },
  { session: 13, date: '2026-03-29', summary: 'Task 7: Facilitator onboarding checklist (7 items), orientation panel, digital signatures (Code of Conduct, Cert Acknowledgment, Group Use License). DB: facilitator_signatures table + 6 onboarding columns.' },
  { session: 14, date: '2026-03-29', summary: 'Task 8: Org Hub onboarding. 7 new columns on organizations. 8 API routes under /api/org/. Hub 5-tab UI. Task 9: Prospect system (5 DB tables, /explore/[code], ILA e-signature, /admin/agreements). Task 10 Parts A-D: Trainer Tier platform - 7 new facilitator_profiles columns, trainer_events + trainer_certifications tables, admin trainer UI, Trainer Hub 5-tab dashboard, 6 API routes /api/trainer/, answer keys with 60s signed URLs, 6 Kit custom fields, cert ID format LG-T-YYYY-XXXX.' },
  { session: 15, date: '2026-03-30', summary: 'Login fix: non-www POST 307 dropped body. Fix 1: next.config.ts www redirect. Fix 2: cookie domain .tripillarstudio.com. Confirmed live. Test facilitator account created. Role Preview Mode: Wayne/Jamie topbar dropdown for all 6 roles, gold banner, no DB writes. Onboarding Wizard: 8-screen wizard replaces checklist, DB onboarding_step column, progress bar. Book names locked (4 books only).' },
  { session: 16, date: '2026-03-30', summary: 'Fix 3: Correct book names everywhere, Books 5/6 removed from all selectors. Fix 4: Storage path fixes - 40/40 OK, trainer-documents bucket populated, invented filenames removed. Fix 5: dismissed_trainer_orientation column added. Jamie override verified in all OWNER_EMAILS checks. 37 DB indexes deployed. LGY Parts 1-6: 4 DB columns, storage placeholders, /api/hub/lgy-documents, /api/trainer/lgy-resources, admin LGY fields, Youth tab in Facilitator Hub, LGY Resources in Trainer Hub.' },
  { session: 17, date: '2026-03-30', summary: 'LGY storage upload complete: 37/37 files uploaded (facilitator-documents/lgy/ 31 files, admin-documents/lgy/ 6 files). Wayne/Jamie login diagnostic confirmed. Passwords force-reset via admin API. Login debug ongoing - HTTP 307 on non-www POST.' },
  { session: 18, date: '2026-03-30', summary: 'FM1 Week 1 content extracted for onboarding wizard Step 6 (full structured JSON). Wayne/Jamie name audit: 8 files changed, 22 replacements - all user-facing "Wayne/Jamie" replaced with "Tri-Pillars" or "your trainer". Document integrity audit: 48 files, 47 PASS, 1 FLAG (CSV headers-only - expected). Render audit: 48/48 PASS via signed URLs.' },
  { session: 19, date: '2026-03-30', summary: 'Book removal from facilitator-documents: 38 files deleted (4 CFRG, 4 FM, 4 TM, 13 LGY Elementary S1-S13, 13 LGY Middle/High S1-S13). 3 API routes updated to remove all book references. physicalMaterialsNotice added to all 3 route responses. Physical materials notice banner deployed in Hub Documents and Trainer Resources tabs. Final render audit: 38/38 PASS.' },
  { session: 20, date: '2026-03-31', summary: 'Buffer social media setup (Wayne account): Facebook Live And Grieve page connected. TikTok @tri.pillars connected then disconnected (wrong account - @liveandgrieve/10K needed). KDP WB1-4 prices updated to $24.99 via Browser Relay. Kit sequence 2702351 "Trainer - Fee Reminder" copy finalized. Supabase purchases table: 6 test rows deleted. Vercel env vars added. Onboarding wizard Step 6 FM1 Week 1 inline content confirmed already implemented.' },
  { session: 21, date: '2026-04-02', summary: 'All 3 API route bugs fixed: /api/free-guide-subscribe (SMTP await), /api/contact (Resend notification to Wayne), /api/subscribe (/courses/ to /sequences/). lib/mailer.ts: Namecheap SMTP, from ember@tripillarstudio.com. Hampshire ILA draft placed in Supabase admin-documents/legal/. Calendly live (live.n.grieve@gmail.com, Google Meet, Mon-Fri 9am-5pm CT). Kit sequences built: Hospice Compliance 5-Touch 28-Day (2706869), B2C Nurture 5-Touch 21-Day Founder Arc (2706891 with Wayne copy), Institutional Onboarding 5-Touch 30-Day (2706915). 5 Hampshire pilot broadcast drafts created. TikTok 60/60 + Facebook Reels 60/60 scheduled in Buffer. LinkedIn You Carry It 36/36 scheduled (Apr 15-Jul 6, M/W/F 9am CT). Facebook YCI mirror: auto-retry Apr 3. AI audit clean. Grant AI attributions removed.' },
];

const LIVE_FEATURES = [
  { feature: 'Solo Companion app',                               url: 'https://solo.tripillarstudio.com',                     date: '2026-03-27' },
  { feature: 'Stripe payment gate (one-time + installment)',     url: 'https://solo.tripillarstudio.com/gate',               date: '2026-03-27' },
  { feature: 'Stripe webhook (Supabase + Kit)',                  url: '/api/webhook/stripe',                                  date: '2026-03-27' },
  { feature: 'Solo Companion 7-day unlock logic',                url: 'https://solo.tripillarstudio.com',                     date: '2026-03-28' },
  { feature: 'Access code redemption (LGS- prefix)',             url: '/api/redeem-code',                                     date: '2026-03-28' },
  { feature: 'Facilitator Hub dashboard',                        url: 'https://tripillarstudio.com/facilitators/hub',         date: '2026-03-28' },
  { feature: 'Facilitator Hub document library (non-book only)', url: '/facilitators/hub/dashboard (Documents tab)',          date: '2026-03-30' },
  { feature: 'Facilitator onboarding wizard (8 screens)',        url: '/facilitators/hub/dashboard',                          date: '2026-03-30' },
  { feature: 'Digital signatures (CoC, Cert Ack, Group Use)',    url: '/api/hub/sign',                                        date: '2026-03-29' },
  { feature: 'Youth (LGY) tab in Facilitator Hub',              url: '/facilitators/hub/dashboard (Youth tab)',              date: '2026-03-30' },
  { feature: 'Admin panel /admin/facilitators',                  url: 'https://tripillarstudio.com/admin/facilitators',       date: '2026-03-28' },
  { feature: 'Admin document library',                           url: 'https://tripillarstudio.com/admin/documents',          date: '2026-03-29' },
  { feature: 'Admin dashboard /admin/dashboard',                 url: 'https://tripillarstudio.com/admin/dashboard',          date: '2026-03-28' },
  { feature: 'Admin prospect management',                        url: 'https://tripillarstudio.com/admin/prospects',          date: '2026-03-29' },
  { feature: 'Admin agreements + renewals',                      url: '/admin/agreements | /admin/renewals',                  date: '2026-03-29' },
  { feature: 'Prospect landing pages (/explore/[code])',         url: 'https://tripillarstudio.com/explore/[code]',           date: '2026-03-29' },
  { feature: 'ILA e-signature flow',                             url: '/sign/[token]',                                        date: '2026-03-29' },
  { feature: 'Org Hub (5-tab)',                                  url: 'https://tripillarstudio.com/org/hub',                  date: '2026-03-29' },
  { feature: 'Trainer Tier platform (full)',                     url: 'https://tripillarstudio.com/trainers/hub/dashboard',   date: '2026-03-30' },
  { feature: 'Public Trainer Registry',                          url: 'https://tripillarstudio.com/trainers',                 date: '2026-03-30' },
  { feature: 'LGY Hub (facilitator + trainer)',                  url: '/facilitators/hub/dashboard (Youth tab)',              date: '2026-03-30' },
  { feature: 'Four login portals',                               url: '/login/facilitator | /login/trainer | /login/organization | /login/participant', date: '2026-03-30' },
  { feature: 'Role Preview Mode (Wayne/Jamie only)',             url: '/facilitators/hub/dashboard (topbar)',                  date: '2026-03-30' },
  { feature: 'Physical materials notice in all doc libraries',   url: 'Hub Documents + Trainer Resources tabs',               date: '2026-03-30' },
  { feature: 'Hub reporting (quarterly + annual PDFs)',          url: '/facilitators/hub/dashboard (Reports tab)',            date: '2026-03-28' },
  { feature: 'Memorial Wall',                                    url: 'https://tripillarstudio.com/memorial-wall',            date: '2026-03-29' },
  { feature: 'Free Guide page + subscribe flow',                 url: 'https://tripillarstudio.com/free-guide',               date: '2026-03-29' },
  { feature: 'Contact form (Resend)',                            url: 'https://tripillarstudio.com/contact',                  date: '2026-03-29' },
  { feature: '/start landing page',                             url: 'https://tripillarstudio.com/start',                    date: '2026-03-29' },
  { feature: 'Internal context/status/documents API',            url: '/api/internal/*',                                      date: '2026-03-29' },
  { feature: '37 DB indexes deployed',                           url: 'Supabase - all major tables indexed',                  date: '2026-03-30' },
  { feature: 'Kit email sequences (24 total, all DRAFT)',        url: 'kit.com - awaiting Wayne go-signal per sequence',      date: '2026-04-02' },
  { feature: 'TikTok 60/60 scheduled via Buffer',               url: 'Buffer @liveandgrieve - Apr 2 to May 1, 11am+7pm ET', date: '2026-04-02' },
  { feature: 'Facebook Reels 60/60 scheduled via Buffer',       url: 'Buffer Live And Grieve page - Apr 2 to May 31 5pm CT', date: '2026-04-02' },
  { feature: 'LinkedIn You Carry It 36/36 scheduled',           url: 'Buffer Jamie Simms - Apr 15 to Jul 6, M/W/F 9am CT',  date: '2026-04-02' },
  { feature: 'Hampshire pilot broadcast drafts (5)',             url: 'Kit broadcasts - Wayne posts manually per week',       date: '2026-04-02' },
  { feature: 'enroll_institution.py B2B enrollment script',     url: '~/.openclaw/workspace/live-and-grieve/scripts/',       date: '2026-04-02' },
];

const PENDING_TASKS = [
  { priority: 1,  task: 'Solo Companion Books 2-4 content - not started' },
  { priority: 2,  task: 'Org Hub youth licensing - not started' },
  { priority: 3,  task: 'ILA attorney review required before prospect system (Task 9) goes live externally' },
  { priority: 4,  task: 'NP Clinical Advisor Agreement - no doc exists, Wayne needs more info, physical signature required' },
  { priority: 5,  task: 'Inner Work Guide onboarding wizard Step 3 - inventory questions blank in source file, awaiting Wayne clarification' },
  { priority: 6,  task: 'Facebook YCI mirror (36 posts) - auto-retry cron Apr 3 12:30pm EDT. No action needed.' },
  { priority: 7,  task: 'Buffer API key expires 2027-04-02 - renewal reminder set.' },
  { priority: 8,  task: 'Kit B2B hospice sequence (2706869) - 22 high-priority orgs staged, email hold until April 12 Wayne go-signal. Verify emails via Apollo.io first.' },
  { priority: 9,  task: 'All Kit sequences on hold - no enrollments until April 12 Wayne go-signal' },
  { priority: 10, task: 'KDP TM1-LP upload - Browser Relay required, font pipeline must run first (fix_fonts.py + LibreOffice + patch_pdf_fonts.py)' },
  { priority: 11, task: 'KDP TM3, TM4, CFRG1-4 paperback editions - not started' },
  { priority: 12, task: 'KDP FM1-4 and TM1-4 pricing - need Browser Relay session to verify and set correct tiers ($49.99 FM / $59.99 TM)' },
  { priority: 13, task: 'Hampshire ILA - CAA Director info, effective date, facilitator count, and signatures still needed. Reminder set Apr 19.' },
];

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let live_counts: Record<string, number> = {};
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const tables = ['facilitator_profiles', 'organizations', 'cohorts', 'purchases', 'memorial_entries', 'prospects', 'agreements'];
    const results = await Promise.all(
      tables.map(t => sb.from(t).select('*', { count: 'exact', head: true }))
    );
    tables.forEach((t, i) => { live_counts[t] = results[i].count ?? 0; });
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
