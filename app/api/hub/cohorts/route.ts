import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';
import { notifyWayne } from '@/lib/notify-wayne';

const getUser = (req: NextRequest) => getUserFromRequest(req);

// GET /api/hub/cohorts — get cohorts for current facilitator + announcements
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get facilitator profile to find profile id
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const facilitatorId = profile?.id;

  // Cohorts
  const { data: cohorts, error: cohortErr } = await supabase
    .from('cohorts')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('start_date', { ascending: false });

  if (cohortErr) return NextResponse.json({ error: cohortErr.message }, { status: 500 });

  // Announcements (active, newest first, pinned first)
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, published_at, pinned')
    .eq('active', true)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ cohorts: cohorts ?? [], announcements: announcements ?? [] });
}

// POST /api/hub/cohorts — log a new cohort
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { book_number, start_date, end_date, participant_count, notes } = body;

  if (!book_number || !start_date) {
    return NextResponse.json({ error: 'book_number and start_date required' }, { status: 400 });
  }

  const { data, error } = await supabase.from('cohorts').insert({
    facilitator_id:    profile.id,
    organization_id:   profile.organization_id ?? null,
    book_number:       Number(book_number),
    start_date,
    end_date:          end_date ?? null,
    participant_count: participant_count ? Number(participant_count) : null,
    status:            'active',
    notes:             notes ?? null,
    created_at:        new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify Wayne — non-fatal
  notifyWayne(
    `New Cohort Logged — Book ${book_number}`,
    `A facilitator logged a new cohort.\n\nBook: ${book_number}\nStart Date: ${start_date}\nEnd Date: ${end_date ?? 'TBD'}\nParticipant Count: ${participant_count ?? 'TBD'}\n\nNotes:\n${notes ?? 'None'}\n\nCohort ID: ${data.id}\nCreated: ${new Date().toISOString()}`
  ).catch(() => {});

  return NextResponse.json({ ok: true, cohort: data });
}
