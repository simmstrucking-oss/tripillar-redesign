import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('lg-admin-session')?.value;
  const header = req.headers.get('x-admin-secret');
  return cookie === process.env.ADMIN_SECRET || header === process.env.ADMIN_SECRET;
}

// POST /api/reports/public/refresh — Wayne only, force-refreshes metrics_cache
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb = getSupabaseServer();

  // Delete all cache rows to force rebuild on next public call
  await sb.from('metrics_cache').delete().neq('key', '__never__'); // delete all rows

  // Also recompute immediately
  const [
    { data: completedCohorts },
    { data: activeFacilitators },
    { data: activeOrgs },
  ] = await Promise.all([
    sb.from('cohorts').select('id').eq('status', 'completed'),
    sb.from('facilitator_profiles').select('id').eq('cert_status', 'active'),
    sb.from('organizations').select('id').eq('license_status', 'active'),
  ]);

  const completedIds = (completedCohorts ?? []).map(c => c.id);
  let participantsServed = 0;
  if (completedIds.length > 0) {
    const { data: outcomeRows } = await sb.from('cohort_outcomes')
      .select('post_participant_count')
      .in('cohort_id', completedIds)
      .not('post_participant_count', 'is', null);
    participantsServed = (outcomeRows ?? []).reduce((s, o) => s + (o.post_participant_count ?? 0), 0);
  }

  const metrics = {
    participants_served:    participantsServed,
    cohorts_completed:      (completedCohorts ?? []).length,
    facilitators_certified: (activeFacilitators ?? []).length,
    organizations_licensed: (activeOrgs ?? []).length,
  };

  const now = new Date().toISOString();
  await Promise.all(
    Object.entries(metrics).map(([key, value]) =>
      sb.from('metrics_cache').upsert(
        { key, value: String(value), updated_at: now },
        { onConflict: 'key' }
      )
    )
  );

  return NextResponse.json({ ok: true, refreshed_at: now, metrics });
}
