import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

// GET /api/admin/trainer-events?page=1&trainer_id=xxx&fees_remitted=false
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page          = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const trainer_id    = searchParams.get('trainer_id') ?? '';
  const fees_remitted = searchParams.get('fees_remitted');
  const limit         = 25;
  const from          = (page - 1) * limit;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Join trainer name from facilitator_profiles
  let query = supabase
    .from('trainer_events')
    .select(
      `id, book_number, event_type, event_date, host_organization, participant_count,
       certification_fees_collected, fees_remitted, fees_remitted_at, created_at,
       trainer_id,
       facilitator_profiles!trainer_id ( full_name, email, trainer_cert_id )`,
      { count: 'exact' }
    )
    .range(from, from + limit - 1)
    .order('event_date', { ascending: false });

  if (trainer_id) query = query.eq('trainer_id', trainer_id);
  if (fees_remitted === 'true')  query = query.eq('fees_remitted', true);
  if (fees_remitted === 'false') query = query.eq('fees_remitted', false);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, pages: Math.ceil((count ?? 0) / limit) });
}

// PATCH /api/admin/trainer-events — mark fees remitted by admin
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { event_id, fees_remitted } = await req.json().catch(() => ({}));
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase
    .from('trainer_events')
    .update({
      fees_remitted: fees_remitted ?? true,
      fees_remitted_at: fees_remitted !== false ? new Date().toISOString() : null,
    })
    .eq('id', event_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
