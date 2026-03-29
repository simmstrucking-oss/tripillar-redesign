import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

export async function GET(
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

  const { id: facilitatorId } = await params;

  // Verify this facilitator was certified by the current trainer
  const { data: certification, error: certError } = await supabase
    .from('trainer_certifications')
    .select('id')
    .eq('trainer_id', profile.id)
    .eq('facilitator_id', facilitatorId)
    .limit(1)
    .single();

  if (certError || !certification) {
    return NextResponse.json(
      { error: 'Facilitator not found or not certified by you' },
      { status: 404 }
    );
  }

  // Get cohorts for this facilitator
  const { data: cohorts, error: cohortsError } = await supabase
    .from('cohorts')
    .select('*')
    .eq('facilitator_id', facilitatorId)
    .order('start_date', { ascending: false });

  if (cohortsError) {
    return NextResponse.json({ error: cohortsError.message }, { status: 500 });
  }

  return NextResponse.json({ cohorts: cohorts ?? [] });
}
