import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service-role client — used only for profile validation and GET reads
// (service_role has no SELECT on facilitator_reflections; GET uses authenticated client)
function sbService() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

// Authenticated client — uses the facilitator's own JWT so RLS applies
function sbAuth(jwt: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { autoRefreshToken: false, persistSession: false } });
}

// POST /api/hub/reflections — facilitator submits a private reflection
// Uses authenticated client so RLS enforces facilitator_id ownership.
// service_role has no access to this table — by design.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { facilitator_id, cohort_id, session_number, went_well, challenges, concerns, self_care } = body;

  if (!facilitator_id) {
    return NextResponse.json({ error: 'facilitator_id is required' }, { status: 400 });
  }

  // Validate profile exists using service client (facilitator_profiles is readable by service_role)
  const supabaseService = sbService();
  const { data: profile } = await supabaseService.from('facilitator_profiles')
    .select('id').eq('id', facilitator_id).single();
  if (!profile) {
    return NextResponse.json({ error: 'Invalid facilitator_id' }, { status: 404 });
  }

  const sn = session_number != null ? Number(session_number) : null;
  if (sn != null && (!Number.isInteger(sn) || sn < 1 || sn > 13)) {
    return NextResponse.json({ error: 'session_number must be between 1 and 13' }, { status: 400 });
  }

  // Insert using the facilitator's own JWT — RLS policy enforces ownership
  const supabaseAuth = sbAuth(jwt);
  const { data, error } = await supabaseAuth.from('facilitator_reflections').insert({
    facilitator_id,
    cohort_id: cohort_id || null,
    session_number: sn,
    went_well: went_well || null,
    challenges: challenges || null,
    concerns: concerns || null,
    self_care: !!self_care,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}

// GET /api/hub/reflections — facilitator fetches their own reflections (private, no admin access)
// Uses authenticated client — service_role cannot read this table.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const facilitatorId = req.nextUrl.searchParams.get('facilitator_id');
  if (!facilitatorId) {
    return NextResponse.json({ error: 'facilitator_id query param required' }, { status: 400 });
  }

  const supabase = sbAuth(jwt);
  const { data: reflections, error } = await supabase
    .from('facilitator_reflections')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reflections: reflections ?? [] });
}
