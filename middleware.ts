import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Route protection rules ────────────────────────────────────────────────────
//
//  /facilitators/login       → public (login page)
//  /facilitators/hub/*       → requires valid Supabase session (role: facilitator | org_admin)
//  /org/dashboard            → requires valid session (role: org_admin)
//  /admin/facilitators       → requires x-admin-secret header OR admin cookie
//  /api/create-facilitator   → requires x-admin-secret header (handled in route itself)

const PROTECTED_HUB     = /^\/facilitators\/hub(\/|$)/;
const PROTECTED_ORG_HUB = /^\/org\/(hub|onboarding)(\/|$)/;
const PROTECTED_ORG     = /^\/org\/dashboard(\/|$)/;
const PROTECTED_ADMIN   = /^\/admin\/facilitators(\/|$)/;

// ── Helper: verify JWT from cookie ───────────────────────────────────────────
// Supabase JS v2 stores tokens in chunked cookies:
//   sb-<ref>-auth-token.0=<chunk0>
//   sb-<ref>-auth-token.1=<chunk1>
// or as a single cookie sb-<ref>-auth-token=<value>
// We must reassemble chunks before parsing.
async function getSessionUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';

  // Collect all cookie key=value pairs
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    cookies[key] = val;
  }

  // Find the base token cookie name (e.g. "sb-wuwgbdjgsgtsmuctuhpt-auth-token")
  let rawToken: string | null = null;

  // Try single-cookie format first
  const singleMatch = Object.keys(cookies).find(k => /^sb-[^.]+?-auth-token$/.test(k));
  if (singleMatch) {
    rawToken = decodeURIComponent(cookies[singleMatch]);
  } else {
    // Try chunked format — reassemble ordered chunks
    const chunkBase = Object.keys(cookies)
      .find(k => /^sb-[^.]+?-auth-token\.0$/.test(k))
      ?.replace(/\.0$/, '');
    if (chunkBase) {
      let assembled = '';
      let i = 0;
      while (cookies[`${chunkBase}.${i}`] !== undefined) {
        assembled += decodeURIComponent(cookies[`${chunkBase}.${i}`]);
        i++;
      }
      rawToken = assembled;
    }
  }

  if (!rawToken) return null;

  let tokenData: { access_token?: string } | null = null;
  try {
    tokenData = JSON.parse(rawToken);
  } catch {
    try {
      tokenData = JSON.parse(Buffer.from(rawToken, 'base64').toString());
    } catch {
      return null;
    }
  }

  if (!tokenData?.access_token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.getUser(tokenData.access_token);
  if (error || !data?.user) return null;
  return data.user;
}


// ── Owner override (hard-coded, immutable) ───────────────────────────────────
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

async function isOwner(req: NextRequest): Promise<boolean> {
  const user = await getSessionUser(req);
  return !!user && OWNER_EMAILS.includes(user.email ?? '');
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Owner override — unrestricted access ────────────────────────────────
  if (await isOwner(req)) {
    const res = NextResponse.next();
    res.headers.set('x-owner-override', 'true');
    res.headers.set('x-cert-status', 'active');
    res.headers.set('x-user-role', 'admin');
    return res;
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (PROTECTED_ADMIN.test(pathname)) {
    const adminSecret  = req.headers.get('x-admin-secret');
    const adminCookie  = req.cookies.get('lg-admin-session')?.value;
    const validSecret  = process.env.ADMIN_SECRET!;

    if (adminSecret !== validSecret && adminCookie !== validSecret) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=admin', req.url));
    }
    return NextResponse.next();
  }

  // ── Facilitator hub routes ────────────────────────────────────────────────
  if (PROTECTED_HUB.test(pathname)) {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=session', req.url));
    }
    // Role check — fetch profile role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await supabase
      .from('facilitator_profiles')
      .select('role, cert_status')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=no-profile', req.url));
    }
    // Expired cert → still allow login but add header for hub to show banner
    const res = NextResponse.next();
    res.headers.set('x-cert-status', profile.cert_status ?? 'unknown');
    res.headers.set('x-user-role', profile.role ?? 'community');
    return res;
  }

  // ── Org hub / onboarding (org_contact role via user_metadata) ─────────────
  if (PROTECTED_ORG_HUB.test(pathname)) {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.redirect(new URL('/org/login?reason=session', req.url));
    }
    if (user.user_metadata?.role !== 'org_contact') {
      return NextResponse.redirect(new URL('/org/login?reason=role', req.url));
    }
    return NextResponse.next();
  }

  // ── Org dashboard ─────────────────────────────────────────────────────────
  if (PROTECTED_ORG.test(pathname)) {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=session', req.url));
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: profile } = await supabase
      .from('facilitator_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'org_admin') {
      return NextResponse.redirect(new URL('/facilitators/hub/dashboard', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/facilitators/hub/:path*',
    '/org/hub/:path*',
    '/org/onboarding/:path*',
    '/org/dashboard/:path*',
    '/admin/facilitators/:path*',
  ],
};
