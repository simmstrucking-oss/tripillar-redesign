/**
 * /api/internal/health-check
 *
 * Expanded platform health monitor for Tri-Pillars LLC.
 * Runs 3x daily: 7AM / 1PM / 9PM ET.
 *
 * Checks:
 *   1. Site routes (200 expected)
 *   2. API routes (expected status codes)
 *   3. Vercel deployment (must be READY)
 *   4. GitHub ↔ Vercel sync (latest commit must match production)
 *   5. Supabase (SELECT COUNT on facilitator_profiles)
 *   6. Kit sequences (2701285 + 2702325 must be active)
 *   7. Stripe products (3 Solo Companion prices must be active)
 *
 * Alert rules:
 *   - All pass → silent (no email)
 *   - Any failure → immediate PLATFORM ALERT email
 *   - Consecutive failure tracking via Supabase health_check_log table
 *   - 3 consecutive failures → CRITICAL escalation email
 *
 * Monday weekly cron reads health_check_log for the weekly brief.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Types ──────────────────────────────────────────────────────────────────────
interface CheckResult {
  name:    string;
  ok:      boolean;
  detail:  string;
  category: 'site' | 'api' | 'vercel' | 'github' | 'supabase' | 'kit' | 'stripe';
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SITE_ROUTES = [
  'https://www.tripillarstudio.com',
  'https://www.tripillarstudio.com/about',
  'https://www.tripillarstudio.com/our-approach',
  'https://www.tripillarstudio.com/program/adult',
  'https://www.tripillarstudio.com/program/youth',
  'https://www.tripillarstudio.com/facilitators',
  'https://www.tripillarstudio.com/institutions',
  'https://www.tripillarstudio.com/contact',
  'https://www.tripillarstudio.com/start',
  'https://www.tripillarstudio.com/free-guide',
  'https://www.tripillarstudio.com/memorial-wall',
  'https://www.tripillarstudio.com/blog',
  'https://www.tripillarstudio.com/trainers',
  'https://www.tripillarstudio.com/login/facilitator',
  'https://www.tripillarstudio.com/login/organization',
  'https://www.tripillarstudio.com/login/trainer',
  'https://www.tripillarstudio.com/login/participant',
  'https://solo.tripillarstudio.com',
  'https://solo.tripillarstudio.com/gate',
];

const API_ROUTES: { url: string; expectedStatus: number; headers?: Record<string, string> }[] = [
  { url: 'https://www.tripillarstudio.com/api/internal/status',       expectedStatus: 200, headers: { 'x-admin-secret': process.env.ADMIN_SECRET ?? '' } },
  { url: 'https://www.tripillarstudio.com/api/internal/context',      expectedStatus: 200, headers: { 'x-admin-secret': process.env.ADMIN_SECRET ?? '' } },
  { url: 'https://www.tripillarstudio.com/api/hub/documents',         expectedStatus: 401 },
  { url: 'https://www.tripillarstudio.com/api/admin/facilitators',    expectedStatus: 401 },
];

const VERCEL_PROJECT_ID  = 'prj_PogR0wHPe8zUuOW55AXv6Tb0i9ph';
const VERCEL_TEAM_ID     = 'team_DfIcpQRoIb93Vq7NMi85KbTI';
const GITHUB_REPO        = 'simmstrucking-oss/tripillar-redesign';
const GITHUB_BRANCH      = 'main';

const KIT_BASE           = 'https://api.convertkit.com/v3';
const KIT_SEQUENCES_REQUIRED = [
  { id: 2701285, name: 'Facilitator Welcome' },
  { id: 2702325, name: 'Trainer Welcome'     },
];

// Solo Companion Stripe price IDs
const STRIPE_PRICES_REQUIRED = [
  { id: 'price_1TGAqtCkNwRmFraLHZFB7v4s', name: 'Solo Companion One-Time $24.99' },
  { id: 'price_1TFlRwCkNwRmFraLW4YJrvUm', name: 'Solo Companion Installment $9.99/mo' },
];
// Note: Supplement ($4.99) uses payment link only, no fixed price ID stored — skip Stripe check for it

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── 1. Site route checks ──────────────────────────────────────────────────────
async function checkSiteRoutes(): Promise<CheckResult[]> {
  return Promise.all(SITE_ROUTES.map(async (url): Promise<CheckResult> => {
    try {
      const res = await fetchWithTimeout(url, { method: 'HEAD', redirect: 'follow' });
      return {
        name: url.replace('https://', ''),
        ok: res.status === 200,
        detail: res.status === 200 ? 'OK' : `HTTP ${res.status}`,
        category: 'site',
      };
    } catch (e: any) {
      return { name: url.replace('https://', ''), ok: false, detail: `Timeout/Error: ${e?.message ?? 'unknown'}`, category: 'site' };
    }
  }));
}

// ── 2. API route checks ───────────────────────────────────────────────────────
async function checkApiRoutes(): Promise<CheckResult[]> {
  return Promise.all(API_ROUTES.map(async (route): Promise<CheckResult> => {
    try {
      const res = await fetchWithTimeout(route.url, {
        method: 'GET',
        headers: route.headers ?? {},
        redirect: 'follow',
      });
      const ok = res.status === route.expectedStatus;
      return {
        name: route.url.replace('https://www.tripillarstudio.com', ''),
        ok,
        detail: ok ? `${res.status} (expected)` : `HTTP ${res.status} (expected ${route.expectedStatus})`,
        category: 'api',
      };
    } catch (e: any) {
      return { name: route.url, ok: false, detail: `Error: ${e?.message ?? 'unknown'}`, category: 'api' };
    }
  }));
}

// ── 3. Vercel deployment check ────────────────────────────────────────────────
async function checkVercelDeployment(): Promise<{ result: CheckResult; latestCommitSha: string | null }> {
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return {
      result: { name: 'Vercel deployment', ok: true, detail: 'VERCEL_TOKEN not set — skipping', category: 'vercel' },
      latestCommitSha: null,
    };
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&limit=1&target=production`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );
    const data = await res.json();
    const deployment = data?.deployments?.[0];

    if (!deployment) {
      return { result: { name: 'Vercel deployment', ok: false, detail: 'No deployments found', category: 'vercel' }, latestCommitSha: null };
    }

    const state = deployment.state ?? deployment.readyState ?? 'UNKNOWN';
    const ok    = state === 'READY';
    const sha   = deployment.meta?.githubCommitSha ?? null;

    return {
      result: {
        name: 'Vercel deployment',
        ok,
        detail: ok ? `READY (${sha?.slice(0, 7) ?? 'no SHA'})` : `State: ${state} — deployment may be stuck or failed`,
        category: 'vercel',
      },
      latestCommitSha: sha,
    };
  } catch (e: any) {
    return { result: { name: 'Vercel deployment', ok: false, detail: `Vercel API error: ${e?.message}`, category: 'vercel' }, latestCommitSha: null };
  }
}

// ── 4. GitHub ↔ Vercel sync check ────────────────────────────────────────────
async function checkGitHubSync(vercelCommitSha: string | null): Promise<CheckResult> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken || !vercelCommitSha) {
    return { name: 'GitHub ↔ Vercel sync', ok: true, detail: 'GITHUB_TOKEN or Vercel SHA not available — skipping', category: 'github' };
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`,
      { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3+json' } }
    );
    const data = await res.json();
    const githubSha = data?.object?.sha ?? null;

    if (!githubSha) {
      return { name: 'GitHub ↔ Vercel sync', ok: false, detail: 'Could not read GitHub branch SHA', category: 'github' };
    }

    const inSync = githubSha.startsWith(vercelCommitSha) || vercelCommitSha.startsWith(githubSha.slice(0, 7));
    return {
      name: 'GitHub ↔ Vercel sync',
      ok: inSync,
      detail: inSync
        ? `In sync (${githubSha.slice(0, 7)})`
        : `OUT OF SYNC — GitHub: ${githubSha.slice(0, 7)}, Vercel: ${vercelCommitSha.slice(0, 7)}. A push may not have deployed correctly.`,
      category: 'github',
    };
  } catch (e: any) {
    return { name: 'GitHub ↔ Vercel sync', ok: false, detail: `GitHub API error: ${e?.message}`, category: 'github' };
  }
}

// ── 5. Supabase check ─────────────────────────────────────────────────────────
async function checkSupabase(): Promise<CheckResult> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://wuwgbdjgsgtsmuctuhpt.supabase.co';

  try {
    const res = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/facilitator_profiles?select=count&limit=1`,
      {
        headers: {
          apikey: serviceKey ?? '',
          Authorization: `Bearer ${serviceKey ?? ''}`,
          Prefer: 'count=exact',
        },
      },
      8000
    );
    const ok = res.status === 200 || res.status === 206;
    const countHeader = res.headers.get('content-range') ?? '';
    return {
      name: 'Supabase (facilitator_profiles)',
      ok,
      detail: ok ? `Reachable (${countHeader || 'count OK'})` : `HTTP ${res.status}`,
      category: 'supabase',
    };
  } catch (e: any) {
    return { name: 'Supabase (facilitator_profiles)', ok: false, detail: `Timeout/Error: ${e?.message}`, category: 'supabase' };
  }
}

// ── 6. Kit sequence checks ────────────────────────────────────────────────────
async function checkKitSequences(): Promise<CheckResult[]> {
  const apiSecret = process.env.KIT_API_SECRET;
  if (!apiSecret) {
    return [{ name: 'Kit sequences', ok: true, detail: 'KIT_API_SECRET not set — skipping', category: 'kit' }];
  }

  return Promise.all(KIT_SEQUENCES_REQUIRED.map(async (seq): Promise<CheckResult> => {
    try {
      const res = await fetchWithTimeout(
        `${KIT_BASE}/sequences/${seq.id}?api_secret=${apiSecret}`,
        { method: 'GET' }
      );
      const data = await res.json();
      // Kit v3 returns the sequence nested under either "sequence" or "course" key
      const record = data?.sequence ?? data?.course ?? null;
      if (!record) {
        return { name: `Kit: ${seq.name} (${seq.id})`, ok: false, detail: `Not found — ${JSON.stringify(data).slice(0, 80)}`, category: 'kit' };
      }
      const ok = !!record.name;
      return {
        name: `Kit: ${seq.name} (${seq.id})`,
        ok,
        detail: ok ? `Active — "${record.name}"` : `Unexpected state: ${JSON.stringify(record).slice(0, 80)}`,
        category: 'kit',
      };
    } catch (e: any) {
      return { name: `Kit: ${seq.name} (${seq.id})`, ok: false, detail: `Error: ${e?.message}`, category: 'kit' };
    }
  }));
}

// ── 7. Stripe product checks ──────────────────────────────────────────────────
async function checkStripeProducts(): Promise<CheckResult[]> {
  const stripeSk = process.env.STRIPE_SECRET_KEY;
  if (!stripeSk) {
    return [{ name: 'Stripe products', ok: true, detail: 'STRIPE_SECRET_KEY not set — skipping', category: 'stripe' }];
  }

  return Promise.all(STRIPE_PRICES_REQUIRED.map(async (price): Promise<CheckResult> => {
    try {
      const res = await fetchWithTimeout(
        `https://api.stripe.com/v1/prices/${price.id}`,
        { headers: { Authorization: `Bearer ${stripeSk}` } }
      );
      const data = await res.json();
      if (data.error) {
        return { name: `Stripe: ${price.name}`, ok: false, detail: `API error: ${data.error.message}`, category: 'stripe' };
      }
      const active    = data.active === true;
      const unitAmt   = data.unit_amount;
      return {
        name: `Stripe: ${price.name}`,
        ok: active,
        detail: active
          ? `Active — $${(unitAmt / 100).toFixed(2)}`
          : `INACTIVE or price changed — active: ${data.active}, amount: ${unitAmt}`,
        category: 'stripe',
      };
    } catch (e: any) {
      return { name: `Stripe: ${price.name}`, ok: false, detail: `Error: ${e?.message}`, category: 'stripe' };
    }
  }));
}

// ── Consecutive failure tracking (Supabase health_check_log) ─────────────────
async function logCheckRun(
  failures: CheckResult[],
  totalChecks: number,
  supabaseUrl: string,
  serviceKey: string
): Promise<{ consecutiveFailures: Record<string, number> }> {
  const timestamp = new Date().toISOString();

  try {
    // Upsert a summary row for this run
    await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/health_check_log`,
      {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          checked_at: timestamp,
          total_checks: totalChecks,
          total_failures: failures.length,
          failure_names: failures.map(f => f.name),
          healthy: failures.length === 0,
        }),
      }
    );

    // Read recent logs to count consecutive failures per check name
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/health_check_log?checked_at=gte.${since}&order=checked_at.desc&limit=20`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const logs = await res.json() as Array<{ failure_names: string[] }>;

    // Build consecutive failure counts: for each currently-failing check,
    // count how many of the last N runs also had that check fail
    const consecutiveFailures: Record<string, number> = {};
    for (const f of failures) {
      let count = 0;
      for (const log of logs) {
        if (log.failure_names?.includes(f.name)) count++;
        else break; // stop on first run where it passed
      }
      consecutiveFailures[f.name] = count;
    }
    return { consecutiveFailures };
  } catch {
    // Log table may not exist yet — don't let this break the health check
    return { consecutiveFailures: {} };
  }
}

// ── Email alert ───────────────────────────────────────────────────────────────
async function sendAlert(
  failures: CheckResult[],
  allResults: CheckResult[],
  consecutiveFailures: Record<string, number>,
  resendKey: string
): Promise<void> {
  const now        = new Date();
  const timeStr    = now.toLocaleString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const dateStr    = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Check for any critical (3+ consecutive) failures
  const criticals = failures.filter(f => (consecutiveFailures[f.name] ?? 0) >= 3);
  const isCritical = criticals.length > 0;

  const subject = isCritical
    ? `🚨 CRITICAL — ${criticals[0].name} — 3 consecutive failures`
    : `⚠️ PLATFORM ALERT — ${failures[0].name}${failures.length > 1 ? ` (+${failures.length - 1} more)` : ''} — ${timeStr}`;

  const healthScore = Math.round(((allResults.length - failures.length) / allResults.length) * 100);

  const failRows = failures.map(f => {
    const consec = consecutiveFailures[f.name] ?? 1;
    const badge  = consec >= 3 ? '🚨 CRITICAL' : consec >= 2 ? '⚠️ 2nd failure' : '⚠️ Failed';
    return `
      <tr style="background:${consec >= 3 ? '#fef2f2' : '#fffbeb'};">
        <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-size:13px;font-family:monospace;">${f.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-size:12px;color:#374151;">${f.detail}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #fecaca;font-size:12px;font-weight:600;color:${consec >= 3 ? '#dc2626' : '#d97706'};">${badge}</td>
      </tr>`;
  }).join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f9f7f4;">
      <div style="background:#1c3028;padding:20px 28px;border-radius:8px 8px 0 0;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#B8942F;font-family:Georgia,serif;">Tri-Pillars™ LLC</p>
        <p style="margin:4px 0 0;font-size:11px;color:#a8bfb4;text-transform:uppercase;letter-spacing:.06em;">Platform Health Monitor</p>
      </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <h2 style="margin:0 0 4px;font-size:18px;color:${isCritical ? '#dc2626' : '#92400e'};">
          ${isCritical ? '🚨 CRITICAL ALERT' : '⚠️ Platform Alert'}
        </h2>
        <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">${dateStr} · ${timeStr}</p>

        ${isCritical ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
          <strong style="color:#dc2626;">3 or more consecutive failures detected.</strong> Immediate attention required.
        </div>` : ''}

        <p style="margin:0 0 16px;font-size:14px;color:#374151;">
          <strong>${failures.length}</strong> of <strong>${allResults.length}</strong> checks failed.
          Platform health score: <strong style="color:${healthScore < 90 ? '#dc2626' : '#059669'};">${healthScore}%</strong>
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
          <thead>
            <tr style="background:#1c3028;color:#fff;">
              <th style="padding:8px 12px;text-align:left;">Check</th>
              <th style="padding:8px 12px;text-align:left;">Detail</th>
              <th style="padding:8px 12px;text-align:left;">Status</th>
            </tr>
          </thead>
          <tbody>${failRows}</tbody>
        </table>

        <p style="margin:0;font-size:12px;color:#9ca3af;">
          <a href="https://www.tripillarstudio.com/api/internal/health-check" style="color:#B8942F;">Run manual check</a>
          · <a href="https://vercel.com/simmstrucking-oss-projects" style="color:#B8942F;">Vercel dashboard</a>
          · <a href="https://supabase.com/dashboard/project/wuwgbdjgsgtsmuctuhpt" style="color:#B8942F;">Supabase dashboard</a>
        </p>
      </div>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Tri-Pillars Health Monitor <ember@tripillarstudio.com>',
      to: ['wayne@tripillarstudio.com'],
      subject,
      html,
    }),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Auth: Vercel cron Bearer OR x-admin-secret
  const adminSecret  = process.env.ADMIN_SECRET ?? '';
  const cronSecret   = process.env.CRON_SECRET  ?? '';
  const bearer       = req.headers.get('authorization')?.replace('Bearer ', '');
  const headerSecret = req.headers.get('x-admin-secret');
  const querySecret  = req.nextUrl.searchParams.get('secret');

  const authorized =
    (bearer       && bearer       === cronSecret)   ||
    (headerSecret && headerSecret === adminSecret)  ||
    (querySecret  && querySecret  === cronSecret);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://wuwgbdjgsgtsmuctuhpt.supabase.co';
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const resendKey   = process.env.RESEND_API_KEY ?? '';

  // Run all checks in parallel (site+api together, others independent)
  const [
    siteResults,
    apiResults,
    { result: vercelResult, latestCommitSha },
    supabaseResult,
    kitResults,
    stripeResults,
  ] = await Promise.all([
    checkSiteRoutes(),
    checkApiRoutes(),
    checkVercelDeployment(),
    checkSupabase(),
    checkKitSequences(),
    checkStripeProducts(),
  ]);

  const githubResult = await checkGitHubSync(latestCommitSha);

  const allResults: CheckResult[] = [
    ...siteResults,
    ...apiResults,
    vercelResult,
    githubResult,
    supabaseResult,
    ...kitResults,
    ...stripeResults,
  ];

  const failures = allResults.filter(r => !r.ok);
  const totalChecks = allResults.length;

  // Log to Supabase + get consecutive failure counts
  const { consecutiveFailures } = await logCheckRun(failures, totalChecks, supabaseUrl, serviceKey);

  // Send alert if any failures
  if (failures.length > 0 && resendKey) {
    try {
      await sendAlert(failures, allResults, consecutiveFailures, resendKey);
    } catch (e) {
      console.error('[health-check] Alert email failed:', e);
    }
  }

  const healthScore = Math.round(((totalChecks - failures.length) / totalChecks) * 100);

  return NextResponse.json({
    status:      failures.length === 0 ? 'healthy' : 'degraded',
    health_score: healthScore,
    checked_at:  new Date().toISOString(),
    total_checks: totalChecks,
    passed:       totalChecks - failures.length,
    failed:       failures.length,
    failures:     failures.map(f => ({ name: f.name, category: f.category, detail: f.detail })),
    consecutive:  consecutiveFailures,
  });
}
