import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

// ── Route protection rules ────────────────────────────────────────────────────
const PROTECTED_HUB         = /^\/facilitators\/hub(\/|$)/;
const PROTECTED_TRAINER_HUB = /^\/trainers\/hub(\/|$)/;
const PROTECTED_ORG_HUB     = /^\/org\/(hub|onboarding)(\/|$)/;
const PROTECTED_ORG         = /^\/org\/dashboard(\/|$)/;
const PROTECTED_ADMIN       = /^\/admin\/(facilitators|trainers)(\/|$)/;

// ── Owner emails (hard-coded, immutable) ─────────────────────────────────────
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

// ── Admin brute-force rate limiting (Edge-compatible, in-memory per instance) ─
const adminFailMap = new Map<string, { count: number; resetAt: number }>();
const ADMIN_FAIL_LIMIT   = 10;
const ADMIN_FAIL_WINDOW  = 15 * 60 * 1000; // 15 minutes

function isAdminRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = adminFailMap.get(ip);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= ADMIN_FAIL_LIMIT;
}

function recordAdminFail(ip: string): void {
  const now = Date.now();
  const entry = adminFailMap.get(ip);
  if (!entry || now > entry.resetAt) {
    adminFailMap.set(ip, { count: 1, resetAt: now + ADMIN_FAIL_WINDOW });
  } else {
    entry.count++;
  }
}

// ── getSessionUser via auth-helper (Edge-compatible, same as API routes) ─────
async function getSessionUser(req: NextRequest) {
  return getUserFromRequest(req);
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Get session user via auth-helper (Edge-compatible)
  const user = await getSessionUser(req);

  // ── Owner override — unrestricted access ────────────────────────────────
  if (user && OWNER_EMAILS.includes(user.email ?? '')) {
    res.headers.set('x-owner-override', 'true');
    res.headers.set('x-cert-status', 'active');
    res.headers.set('x-user-role', 'admin');
    return res;
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (PROTECTED_ADMIN.test(pathname)) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isAdminRateLimited(ip)) {
      return new NextResponse('Too many failed attempts. Try again later.', { status: 429 });
    }
    const adminSecret = req.headers.get('x-admin-secret');
    const adminCookie = req.cookies.get('lg-admin-session')?.value;
    const validSecret = process.env.ADMIN_SECRET!;
    if (adminSecret !== validSecret && adminCookie !== validSecret) {
      recordAdminFail(ip);
      return NextResponse.redirect(new URL('/login/facilitator?reason=admin', req.url));
    }
    return res;
  }

  // ── Facilitator hub routes ────────────────────────────────────────────────
  if (PROTECTED_HUB.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login/facilitator?reason=session', req.url));
    }
    // Fetch profile role via service client
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await sb
      .from('facilitator_profiles')
      .select('role, cert_status')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/login/facilitator?reason=no-profile', req.url));
    }
    res.headers.set('x-cert-status', profile.cert_status ?? 'unknown');
    res.headers.set('x-user-role', profile.role ?? 'community');
    return res;
  }

  // ── Trainer hub routes ────────────────────────────────────────────────────
  if (PROTECTED_TRAINER_HUB.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login/facilitator?reason=session', req.url));
    }
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await sb
      .from('facilitator_profiles')
      .select('role, cert_status, trainer_status')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/login/facilitator?reason=no-profile', req.url));
    }
    if (profile.role !== 'trainer' && profile.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/facilitators/hub/dashboard', req.url));
    }
    res.headers.set('x-cert-status', profile.cert_status ?? 'unknown');
    res.headers.set('x-user-role', profile.role ?? 'trainer');
    return res;
  }

  // ── Org hub / onboarding ─────────────────────────────────────────────────
  if (PROTECTED_ORG_HUB.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login/organization?reason=session', req.url));
    }
    if (user.user_metadata?.role !== 'org_contact') {
      return NextResponse.redirect(new URL('/login/organization?reason=role', req.url));
    }
    return res;
  }

  // ── Org dashboard ─────────────────────────────────────────────────────────
  if (PROTECTED_ORG.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login/facilitator?reason=session', req.url));
    }
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await sb
      .from('facilitator_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || profile.role !== 'org_admin') {
      return NextResponse.redirect(new URL('/facilitators/hub/dashboard', req.url));
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    '/facilitators/hub/:path*',
    '/trainers/hub/:path*',
    '/org/hub/:path*',
    '/org/onboarding/:path*',
    '/org/dashboard/:path*',
    '/admin/facilitators/:path*',
    '/admin/trainers/:path*',
  ],
};
