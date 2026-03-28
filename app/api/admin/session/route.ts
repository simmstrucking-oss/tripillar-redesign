import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/session
// Body: { secret: string }
// Sets lg-admin-session cookie if secret matches ADMIN_SECRET
export async function POST(req: NextRequest) {
  const { secret } = await req.json().catch(() => ({}));
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('lg-admin-session', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });
  return res;
}

// DELETE /api/admin/session — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('lg-admin-session');
  return res;
}
