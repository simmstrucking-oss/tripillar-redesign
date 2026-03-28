import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

// GET /api/admin/orgs — list all organizations with facilitator count
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseServer();
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, contact_name, contact_email, created_at')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get facilitator counts per org
  const { data: counts } = await supabase
    .from('facilitator_profiles')
    .select('organization_id')
    .not('organization_id', 'is', null);

  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((r: { organization_id: string }) => {
    countMap[r.organization_id] = (countMap[r.organization_id] ?? 0) + 1;
  });

  const enriched = (orgs ?? []).map(o => ({ ...o, facilitator_count: countMap[o.id] ?? 0 }));
  return NextResponse.json({ data: enriched });
}

// POST /api/admin/orgs — create organization
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, contact_name, contact_email } = await req.json().catch(() => ({}));
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, contact_name: contact_name ?? null, contact_email: contact_email ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, org: data });
}

// PATCH /api/admin/orgs?id=xxx — update organization
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const allowed = ['name','type','license_type','license_status','license_start','license_renewal',
                   'contact_name','contact_email','contact_phone','address','state','notes'];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];

  const supabase = getSupabaseServer();
  const { error } = await supabase.from('organizations').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/orgs?id=xxx
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = getSupabaseServer();
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
