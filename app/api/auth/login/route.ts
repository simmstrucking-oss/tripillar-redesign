import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/login
 *
 * Signs the user in server-side via @supabase/ssr createServerClient,
 * which writes the session as proper HTTP cookies (not localStorage).
 * Middleware reads cookies → session persists across navigation.
 *
 * Body: { email: string, password: string }
 * Returns: { ok: true, role?: string } on success, { error: string } on failure.
 */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  // Build a mutable response so Supabase can set cookies on it
  const res = NextResponse.json({ ok: true });

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
              domain: process.env.NODE_ENV === 'production' ? '.tripillarstudio.com' : undefined,
            });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Owner override — Wayne and Jamie always route to admin/facilitator hub
  const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

  // Look up the user's role from facilitator_profiles for client-side routing
  let role: string | null = null;
  if (data.user) {
    if (OWNER_EMAILS.includes(data.user.email ?? '')) {
      role = 'super_admin';
    } else {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: profile } = await sb
        .from('facilitator_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      role = profile?.role ?? null;
    }
  }

  // Re-create response with role included (cookies were already set on `res`)
  const body = JSON.stringify({ ok: true, role });
  const finalRes = new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  // Copy cookies from the original response
  res.cookies.getAll().forEach((c) => {
    finalRes.cookies.set(c.name, c.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.tripillarstudio.com' : undefined,
    });
  });

  return finalRes;
}
