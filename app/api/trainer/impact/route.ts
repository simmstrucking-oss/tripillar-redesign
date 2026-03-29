import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

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

  // Total certified facilitators
  const { count: totalCertified, error: certCountError } = await supabase
    .from('trainer_certifications')
    .select('id', { count: 'exact', head: true })
    .eq('trainer_id', profile.id);

  if (certCountError) {
    return NextResponse.json({ error: certCountError.message }, { status: 500 });
  }

  // Get all facilitator IDs certified by this trainer
  const { data: certifications, error: certListError } = await supabase
    .from('trainer_certifications')
    .select('facilitator_id')
    .eq('trainer_id', profile.id);

  if (certListError) {
    return NextResponse.json({ error: certListError.message }, { status: 500 });
  }

  const facilitatorIds = [...new Set((certifications ?? []).map((c) => c.facilitator_id))];

  let activeInNetwork = 0;
  let totalParticipants = 0;
  let avgCompletionRate = 0;

  if (facilitatorIds.length > 0) {
    // Active in network: facilitators with a cohort start_date within last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const cutoffDate = twelveMonthsAgo.toISOString().split('T')[0];

    const { data: activeCohorts, error: activeError } = await supabase
      .from('cohorts')
      .select('facilitator_id')
      .in('facilitator_id', facilitatorIds)
      .gte('start_date', cutoffDate);

    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }

    const activeFacilitatorIds = new Set((activeCohorts ?? []).map((c) => c.facilitator_id));
    activeInNetwork = activeFacilitatorIds.size;

    // Total participants: sum of participant_count from cohorts
    const { data: allCohorts, error: cohortsError } = await supabase
      .from('cohorts')
      .select('participant_count, status')
      .in('facilitator_id', facilitatorIds);

    if (cohortsError) {
      return NextResponse.json({ error: cohortsError.message }, { status: 500 });
    }

    const cohortList = allCohorts ?? [];
    totalParticipants = cohortList.reduce(
      (sum, c) => sum + (c.participant_count ?? 0),
      0
    );

    // Average completion rate
    const totalCohorts = cohortList.length;
    const completedCohorts = cohortList.filter((c) => c.status === 'completed').length;
    avgCompletionRate = totalCohorts > 0
      ? Math.round((completedCohorts / totalCohorts) * 10000) / 100
      : 0;
  }

  return NextResponse.json({
    total_certified: totalCertified ?? 0,
    active_in_network: activeInNetwork,
    total_participants: totalParticipants,
    avg_completion_rate: avgCompletionRate,
  });
}
