import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

// GET /api/admin/facilitators?page=1&q=search&status=active
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const q      = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const limit  = 25;
  const from   = (page - 1) * limit;

  const supabase = getSupabaseServer();
  let query = supabase
    .from('facilitator_profiles')
    .select('id, user_id, full_name, email, phone, role, cert_id, cert_status, cert_issued, cert_renewal, organization_id, created_at, last_active, lgy_certified_tracks, lgy_trainer, lgy_authorized_tracks', { count: 'exact' })
    .range(from, from + limit - 1)
    .order('created_at', { ascending: false });

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,cert_id.ilike.%${q}%`);
  if (status) query = query.eq('cert_status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, pages: Math.ceil((count ?? 0) / limit) });
}

// PATCH /api/admin/facilitators — update cert_status, role, or LGY fields
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    user_id, cert_status, role, is_publicly_listed,
    lgy_certified_tracks, lgy_trainer, lgy_authorized_tracks,
  } = body;
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const supabase = getSupabaseServer();
  const updates: Record<string, string | boolean | string[] | null> = {};
  if (cert_status !== undefined) updates.cert_status = cert_status;
  if (role !== undefined) updates.role = role;
  if (is_publicly_listed !== undefined) updates.is_publicly_listed = is_publicly_listed;
  // LGY fields — null clears the assignment
  if (lgy_certified_tracks !== undefined) updates.lgy_certified_tracks = lgy_certified_tracks?.length ? lgy_certified_tracks : null;
  if (lgy_trainer !== undefined) updates.lgy_trainer = lgy_trainer;
  if (lgy_authorized_tracks !== undefined) updates.lgy_authorized_tracks = lgy_authorized_tracks?.length ? lgy_authorized_tracks : null;

  const { error } = await supabase.from('facilitator_profiles').update(updates).eq('user_id', user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/facilitators?user_id=xxx — remove facilitator + auth user
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user_id = req.nextUrl.searchParams.get('user_id');
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const supabase = getSupabaseServer();

  // Delete profile first (FK constraint)
  const { error: profileErr } = await supabase.from('facilitator_profiles').delete().eq('user_id', user_id);
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

  // Delete auth user
  const { error: authErr } = await supabase.auth.admin.deleteUser(user_id);
  if (authErr) return NextResponse.json({ error: authErr.message, note: 'Profile deleted but auth user removal failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
