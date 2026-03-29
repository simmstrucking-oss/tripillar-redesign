import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// ── Route protection rules ────────────────────────────────────────────────────
const PROTECTED_HUB     = /^\/facilitators\/hub(\/|$)/;
const PROTECTED_ORG_HUB = /^\/org\/(hub|onboarding)(\/|$)/;
const PROTECTED_ORG     = /^\/org\/dashboard(\/|$)/;
const PROTECTED_ADMIN   = /^\/admin\/facilitators(\/|$)/;

// ── Owner emails (hard-coded, immutable) ─────────────────────────────────────
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

// ── getSessionUser via @supabase/ssr createServerClient ──────────────────────
// This is the official approach — handles chunked cookies + base64url encoding
// automatically. We pass a mutable response so Supabase can refresh tokens.
async function getSessionUser(req: NextRequest, res: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Get session user (handles cookie refresh automatically)
  const user = await getSessionUser(req, res);

  // ── Owner override — unrestricted access ────────────────────────────────
  if (user && OWNER_EMAILS.includes(user.email ?? '')) {
    res.headers.set('x-owner-override', 'true');
    res.headers.set('x-cert-status', 'active');
    res.headers.set('x-user-role', 'admin');
    return res;
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (PROTECTED_ADMIN.test(pathname)) {
    const adminSecret = req.headers.get('x-admin-secret');
    const adminCookie = req.cookies.get('lg-admin-session')?.value;
    const validSecret = process.env.ADMIN_SECRET!;
    if (adminSecret !== validSecret && adminCookie !== validSecret) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=admin', req.url));
    }
    return res;
  }

  // ── Facilitator hub routes ────────────────────────────────────────────────
  if (PROTECTED_HUB.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=session', req.url));
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
      return NextResponse.redirect(new URL('/facilitators/login?reason=no-profile', req.url));
    }
    res.headers.set('x-cert-status', profile.cert_status ?? 'unknown');
    res.headers.set('x-user-role', profile.role ?? 'community');
    return res;
  }

  // ── Org hub / onboarding ─────────────────────────────────────────────────
  if (PROTECTED_ORG_HUB.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/org/login?reason=session', req.url));
    }
    if (user.user_metadata?.role !== 'org_contact') {
      return NextResponse.redirect(new URL('/org/login?reason=role', req.url));
    }
    return res;
  }

  // ── Org dashboard ─────────────────────────────────────────────────────────
  if (PROTECTED_ORG.test(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/facilitators/login?reason=session', req.url));
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
    '/org/hub/:path*',
    '/org/onboarding/:path*',
    '/org/dashboard/:path*',
    '/admin/facilitators/:path*',
  ],
};
