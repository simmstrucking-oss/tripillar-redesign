import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: eventId } = await params;

  // Verify the event belongs to this trainer
  const { data: existingEvent, error: fetchError } = await supabase
    .from('trainer_events')
    .select('id, trainer_id')
    .eq('id', eventId)
    .single();

  if (fetchError || !existingEvent) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (existingEvent.trainer_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Mark fees as remitted
  const { data: updatedEvent, error: updateError } = await supabase
    .from('trainer_events')
    .update({
      fees_remitted: true,
      fees_remitted_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ event: updatedEvent });
}
