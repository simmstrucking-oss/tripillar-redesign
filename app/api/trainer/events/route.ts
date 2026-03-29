import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const VALID_EVENT_TYPES = ['virtual_cohort', 'hosted_virtual', 'hosted_in_person'] as const;
const CERTIFICATION_FEE_PER_PARTICIPANT = 450;

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check role
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role, books_authorized_to_train')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: events, error } = await supabase
    .from('trainer_events')
    .select('*')
    .eq('trainer_id', profile.id)
    .order('event_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check role
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role, books_authorized_to_train')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    book_number?: number;
    event_type?: string;
    event_date?: string;
    host_organization?: string;
    participant_count?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { book_number, event_type, event_date, host_organization, participant_count } = body;

  if (!book_number || !event_type || !event_date || participant_count == null) {
    return NextResponse.json(
      { error: 'Missing required fields: book_number, event_type, event_date, participant_count' },
      { status: 400 }
    );
  }

  if (!VALID_EVENT_TYPES.includes(event_type as typeof VALID_EVENT_TYPES[number])) {
    return NextResponse.json(
      { error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const certification_fees_collected = CERTIFICATION_FEE_PER_PARTICIPANT * participant_count;

  const { data: newEvent, error } = await supabase
    .from('trainer_events')
    .insert({
      trainer_id: profile.id,
      book_number,
      event_type,
      event_date,
      host_organization: host_organization ?? null,
      participant_count,
      certification_fees_collected,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: newEvent }, { status: 201 });
}
