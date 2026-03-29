import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getUserFromRequest } from '@/lib/auth-helper';

interface Outcome {
  cohort_id: string;
  pre_participant_count: number | null;
  post_participant_count: number | null;
  completion_rate: number | null;
  post_grief_intensity_rating: number | null;
  post_connection_rating: number | null;
  post_self_care_rating: number | null;
  post_hope_rating: number | null;
  post_submitted_at: string | null;
}

interface SessionLog {
  cohort_id: string;
  week_number: number;
  session_date: string | null;
  session_duration_minutes: number | null;
  participants_attended: number | null;
  group_composition_stable: boolean | null;
  co_facilitated: boolean | null;
  critical_incident: boolean | null;
}

async function resolveCallerRole(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const sb = getSupabaseServer();
  const { data } = await sb.from('facilitator_profiles').select('id, role, organization_id, email').eq('user_id', user.id).single();
  if (!data) return null;
  // Owner override
  if (user.email === 'wayne@tripillarstudio.com' || user.email === 'jamie@tripillarstudio.com') {
    return { ...data, role: 'admin' };
  }
  return data;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ facilitator_id: string }> }) {
  const caller = await resolveCallerRole(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { facilitator_id } = await params;
  const sb = getSupabaseServer();

  // Auth enforcement
  if (caller.role !== 'admin') {
    if (caller.role === 'org_admin') {
      const { data: target } = await sb.from('facilitator_profiles')
        .select('organization_id').eq('id', facilitator_id).single();
      if (!target || target.organization_id !== caller.organization_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      if (caller.id !== facilitator_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  const { data: profile, error: profErr } = await sb.from('facilitator_profiles')
    .select('id, full_name, email, cert_id, cert_status, cert_issued, cert_renewal, role, organization_id, books_certified, created_at, last_active')
    .eq('id', facilitator_id).single();
  if (profErr || !profile) return NextResponse.json({ error: 'Facilitator not found' }, { status: 404 });

  let org: { name: string } | null = null;
  if (profile.organization_id) {
    const { data: o } = await sb.from('organizations').select('name').eq('id', profile.organization_id).single();
    org = o;
  }

  const { data: cohortsRaw } = await sb.from('cohorts')
    .select('id, book_number, status, start_date, end_date, participant_count, notes')
    .eq('facilitator_id', facilitator_id)
    .order('start_date', { ascending: false });
  const cohorts = cohortsRaw ?? [];
  const cohortIds = cohorts.map(c => c.id);

  const { data: logsRaw } = cohortIds.length > 0
    ? await sb.from('session_logs')
        .select('cohort_id, week_number, session_date, session_duration_minutes, participants_attended, group_composition_stable, co_facilitated, critical_incident')
        .in('cohort_id', cohortIds)
    : { data: [] as SessionLog[] };

  const { data: outcomesRaw } = cohortIds.length > 0
    ? await sb.from('cohort_outcomes')
        .select('cohort_id, pre_participant_count, post_participant_count, completion_rate, post_grief_intensity_rating, post_connection_rating, post_self_care_rating, post_hope_rating, post_submitted_at')
        .in('cohort_id', cohortIds)
    : { data: [] as Outcome[] };

  const { data: trackerData } = await sb.from('tracker_ratings')
    .select('week_number, grief_intensity, connection, self_care, hope, recorded_at')
    .eq('facilitator_id', facilitator_id)
    .order('recorded_at', { ascending: true });

  const logs     = (logsRaw     ?? []) as SessionLog[];
  const outcomes = (outcomesRaw ?? []) as Outcome[];

  const outcomesMap: Record<string, Outcome> = {};
  outcomes.forEach(o => { outcomesMap[o.cohort_id] = o; });

  const logsMap: Record<string, SessionLog[]> = {};
  logs.forEach(l => {
    if (!logsMap[l.cohort_id]) logsMap[l.cohort_id] = [];
    logsMap[l.cohort_id].push(l);
  });

  const cohortSummaries = cohorts.map(c => {
    const cLogs   = logsMap[c.id] ?? [];
    const outcome = outcomesMap[c.id];
    const totalAtt    = cLogs.reduce((s, l) => s + (l.participants_attended ?? 0), 0);
    const avgAtt      = cLogs.length > 0 ? Math.round(totalAtt / cLogs.length) : null;
    const incidents   = cLogs.filter(l => l.critical_incident).length;
    const rKeys = ['post_grief_intensity_rating', 'post_connection_rating', 'post_self_care_rating', 'post_hope_rating'] as const;
    const avgOutcome = outcome && rKeys.every(k => outcome[k])
      ? Math.round((rKeys.reduce((s, k) => s + (outcome[k] as number), 0) / rKeys.length) * 10) / 10
      : null;

    return {
      cohort_id: c.id, book_number: c.book_number, status: c.status,
      start_date: c.start_date, end_date: c.end_date,
      sessions_logged: cLogs.length, sessions_total: 13,
      avg_attendance: avgAtt,
      pre_enrollment: outcome?.pre_participant_count ?? c.participant_count ?? null,
      post_completions: outcome?.post_participant_count ?? null,
      completion_rate: outcome?.completion_rate ?? null,
      avg_outcome_rating: avgOutcome,
      outcome_ratings: outcome ? {
        grief_intensity: outcome.post_grief_intensity_rating,
        connection:      outcome.post_connection_rating,
        self_care:       outcome.post_self_care_rating,
        hope:            outcome.post_hope_rating,
      } : null,
      critical_incidents: incidents,
      weekly_attendance: cLogs.map(l => ({
        week: l.week_number, date: l.session_date,
        attended: l.participants_attended, duration_min: l.session_duration_minutes,
        stable: l.group_composition_stable, co_facilitated: l.co_facilitated,
      })).sort((a, b) => a.week - b.week),
    };
  });

  const completed = cohortSummaries.filter(c => c.status === 'completed');
  const active    = cohortSummaries.filter(c => c.status === 'active');
  const totalEnrolled  = cohortSummaries.reduce((s, c) => s + (c.pre_enrollment ?? 0), 0);
  const totalCompleted = completed.reduce((s, c) => s + (c.post_completions ?? 0), 0);
  const ratedCohorts   = completed.filter(c => c.avg_outcome_rating !== null);
  const avgOutcomeAll  = ratedCohorts.length > 0
    ? Math.round(ratedCohorts.reduce((s, c) => s + c.avg_outcome_rating!, 0) / ratedCohorts.length * 10) / 10
    : null;

  return NextResponse.json({
    generated_at: new Date().toISOString(), scope: 'facilitator',
    facilitator: {
      id: profile.id, name: profile.full_name, email: profile.email,
      cert_id: profile.cert_id, cert_status: profile.cert_status,
      cert_issued: profile.cert_issued, cert_renewal: profile.cert_renewal,
      role: profile.role, books_certified: profile.books_certified,
      organization: org?.name ?? null,
      member_since: profile.created_at, last_active: profile.last_active,
    },
    aggregate: {
      cohorts_total: cohortSummaries.length, cohorts_active: active.length,
      cohorts_completed: completed.length,
      total_participants_enrolled: totalEnrolled, total_participants_completed: totalCompleted,
      overall_completion_rate: totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : null,
      avg_outcome_rating: avgOutcomeAll,
      total_critical_incidents: cohortSummaries.reduce((s, c) => s + c.critical_incidents, 0),
      books_run: [...new Set(cohortSummaries.map(c => c.book_number))].sort(),
    },
    cohorts: cohortSummaries,
    solo_companion_tracker: trackerData ?? [],
  });
}
