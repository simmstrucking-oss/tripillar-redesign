import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

// POST /api/admin/reset-password
// Body: { user_id, new_password }
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user_id, new_password } = await req.json().catch(() => ({}));
  if (!user_id || !new_password) {
    return NextResponse.json({ error: 'user_id and new_password required' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
