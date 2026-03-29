import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const getUser = (req: NextRequest) => getUserFromRequest(req);

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET /api/hub/session-logs?cohort_id=xxx
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cohort_id = req.nextUrl.searchParams.get('cohort_id');
  if (!cohort_id) return NextResponse.json({ error: 'cohort_id required' }, { status: 400 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Verify facilitator owns this cohort
  const { data: cohort } = await supabase.from('cohorts')
    .select('id, book_number, status').eq('id', cohort_id).eq('facilitator_id', profile.id).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const { data: logs, error } = await supabase.from('session_logs')
    .select('*').eq('cohort_id', cohort_id).order('week_number');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: logs ?? [], cohort });
}

// POST /api/hub/session-logs — upsert a weekly log
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id, organization_id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { cohort_id, week_number, session_date, session_duration_minutes,
          participants_attended, group_composition_stable, co_facilitated,
          facilitator_confidence_rating, notes, critical_incident } = body;

  if (!cohort_id || !week_number || !session_date) {
    return NextResponse.json({ error: 'cohort_id, week_number, session_date required' }, { status: 400 });
  }

  // Verify ownership
  const { data: cohort } = await supabase.from('cohorts')
    .select('id, book_number').eq('id', cohort_id).eq('facilitator_id', profile.id).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const payload = {
    cohort_id,
    facilitator_id:             profile.id,
    organization_id:            profile.organization_id ?? null,
    week_number:                Number(week_number),
    book_number:                cohort.book_number,
    session_date,
    session_duration_minutes:   session_duration_minutes ? Number(session_duration_minutes) : null,
    participants_attended:      Number(participants_attended ?? 0),
    group_composition_stable:   group_composition_stable ?? null,
    co_facilitated:             co_facilitated ?? false,
    facilitator_confidence_rating: facilitator_confidence_rating ? Number(facilitator_confidence_rating) : null,
    notes:                      notes ?? null,
    critical_incident:          critical_incident ?? false,
  };

  // Upsert — unique on (cohort_id, week_number)
  const { data, error } = await supabase.from('session_logs')
    .upsert(payload, { onConflict: 'cohort_id,week_number' }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, log: data });
}
