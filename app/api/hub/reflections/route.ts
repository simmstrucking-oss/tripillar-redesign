import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

// POST /api/hub/reflections — facilitator submits a private reflection
export async function POST(req: NextRequest) {
  const supabase = sb();
  const body = await req.json().catch(() => ({}));
  const { facilitator_id, cohort_id, session_number, went_well, challenges, concerns, self_care } = body;

  if (!facilitator_id) {
    return NextResponse.json({ error: 'facilitator_id is required' }, { status: 400 });
  }

  // Verify facilitator_id exists in facilitator_profiles
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id').eq('id', facilitator_id).single();
  if (!profile) {
    return NextResponse.json({ error: 'Invalid facilitator_id' }, { status: 404 });
  }

  const sn = session_number != null ? Number(session_number) : null;
  if (sn != null && (!Number.isInteger(sn) || sn < 1 || sn > 13)) {
    return NextResponse.json({ error: 'session_number must be between 1 and 13' }, { status: 400 });
  }

  const { data, error } = await supabase.from('facilitator_reflections').insert({
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
export async function GET(req: NextRequest) {
  const facilitatorId = req.nextUrl.searchParams.get('facilitator_id');
  if (!facilitatorId) {
    return NextResponse.json({ error: 'facilitator_id query param required' }, { status: 400 });
  }

  const supabase = sb();
  const { data: reflections, error } = await supabase
    .from('facilitator_reflections')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('submitted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reflections: reflections ?? [] });
}
