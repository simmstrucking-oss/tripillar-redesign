import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /auth/callback
 *
 * Handles Supabase auth token exchange for:
 * - Password recovery / first-time setup links (token_hash + type=recovery)
 * - OAuth / PKCE code exchange (code param)
 *
 * Writes session cookies then redirects to `next` (default: facilitator hub).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code       = searchParams.get('code');
  const token_hash = searchParams.get('token_hash') ?? searchParams.get('token');
  const type       = searchParams.get('type') ?? 'recovery';
  // For recovery/invite types, send to password update page first
  const defaultNext = (type === 'recovery' || type === 'invite')
    ? '/facilitators/set-password'
    : '/facilitators/hub/dashboard';
  const next       = searchParams.get('next') ?? defaultNext;

  const redirectUrl = new URL(next, req.url);
  const res = NextResponse.redirect(redirectUrl);

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
            res.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              domain:
                process.env.NODE_ENV === 'production'
                  ? '.tripillarstudio.com'
                  : undefined,
            });
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login/facilitator?reason=setup-failed`, req.url)
      );
    }
  } else if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login/facilitator?reason=setup-failed`, req.url)
      );
    }
  } else {
    // No token — redirect to login
    return NextResponse.redirect(
      new URL('/login/facilitator', req.url)
    );
  }

  return res;
}
