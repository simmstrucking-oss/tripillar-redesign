import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

interface Outcome {
  cohort_id: string;
  pre_participant_count: number | null;
  post_participant_count: number | null;
  completion_rate: number | null;
  post_grief_intensity_rating: number | null;
  post_connection_rating: number | null;
  post_self_care_rating: number | null;
  post_hope_rating: number | null;
}

interface SessionLog {
  cohort_id: string;
  participants_attended: number | null;
  critical_incident: boolean | null;
}

interface Cohort {
  id: string;
  facilitator_id: string;
  book_number: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  participant_count: number | null;
}

async function resolveCallerRole(req: NextRequest) {
  const sb = getSupabaseServer();
  const cookie = req.cookies.get('lg-admin-session')?.value;
  const header = req.headers.get('x-admin-secret');
  if (cookie === process.env.ADMIN_SECRET || header === process.env.ADMIN_SECRET) {
    return { role: 'admin' as const, profileId: null as string | null, orgId: null as string | null };
  }
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch   = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;
  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch { /* */ }
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch { /* */ }
  }
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await sb.from('facilitator_profiles')
    .select('id, organization_id, role').eq('user_id', data.user.id).single();
  if (!profile) return null;
  return { role: profile.role as string, profileId: profile.id as string, orgId: profile.organization_id as string | null };
}

export async function GET(req: NextRequest, { params }: { params: { org_id: string } }) {
  const caller = await resolveCallerRole(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { org_id } = params;

  if (caller.role !== 'admin') {
    if (caller.role === 'org_admin') {
      if (caller.orgId !== org_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else {
      return NextResponse.json({ error: 'Forbidden: org scope requires org_admin or admin role' }, { status: 403 });
    }
  }

  const sb = getSupabaseServer();

  const { data: org, error: orgErr } = await sb.from('organizations')
    .select('id, name, type, state, city, contact_name, contact_email, license_start, license_end, max_facilitators, status, renewal_count, created_at')
    .eq('id', org_id).single();
  if (orgErr || !org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const { data: facilitatorsRaw } = await sb.from('facilitator_profiles')
    .select('id, full_name, email, cert_id, cert_status, cert_issued, cert_renewal, role, books_certified, created_at, last_active')
    .eq('organization_id', org_id).order('created_at', { ascending: true });
  const facilitators = facilitatorsRaw ?? [];
  const facilitatorIds = facilitators.map(f => f.id);

  const { data: cohortsRaw } = facilitatorIds.length > 0
    ? await sb.from('cohorts')
        .select('id, facilitator_id, book_number, status, start_date, end_date, participant_count')
        .in('facilitator_id', facilitatorIds).order('start_date', { ascending: false })
    : { data: [] as Cohort[] };
  const cohorts = (cohortsRaw ?? []) as Cohort[];
  const cohortIds = cohorts.map(c => c.id);

  const { data: outcomesRaw } = cohortIds.length > 0
    ? await sb.from('cohort_outcomes')
        .select('cohort_id, pre_participant_count, post_participant_count, completion_rate, post_grief_intensity_rating, post_connection_rating, post_self_care_rating, post_hope_rating')
        .in('cohort_id', cohortIds)
    : { data: [] as Outcome[] };

  const { data: logsRaw } = cohortIds.length > 0
    ? await sb.from('session_logs')
        .select('cohort_id, participants_attended, critical_incident')
        .in('cohort_id', cohortIds)
    : { data: [] as SessionLog[] };

  const outcomes   = (outcomesRaw ?? []) as Outcome[];
  const sessionLogs = (logsRaw ?? []) as SessionLog[];

  const outcomesMap: Record<string, Outcome> = {};
  outcomes.forEach(o => { outcomesMap[o.cohort_id] = o; });

  const logsMap: Record<string, SessionLog[]> = {};
  sessionLogs.forEach(l => {
    if (!logsMap[l.cohort_id]) logsMap[l.cohort_id] = [];
    logsMap[l.cohort_id].push(l);
  });

  const cohortsMap: Record<string, Cohort[]> = {};
  cohorts.forEach(c => {
    if (!cohortsMap[c.facilitator_id]) cohortsMap[c.facilitator_id] = [];
    cohortsMap[c.facilitator_id].push(c);
  });

  const facilitatorBreakdowns = facilitators.map(f => {
    const fCohorts   = cohortsMap[f.id] ?? [];
    const fCompleted = fCohorts.filter(c => c.status === 'completed');
    let enrolled = 0, compl = 0, ratingSum = 0, ratedCount = 0, incidents = 0;
    fCohorts.forEach(c => {
      const o    = outcomesMap[c.id];
      const logs = logsMap[c.id] ?? [];
      enrolled  += o?.pre_participant_count ?? c.participant_count ?? 0;
      compl     += o?.post_participant_count ?? 0;
      incidents += logs.filter(l => l.critical_incident).length;
      if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
        ratingSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
        ratedCount++;
      }
    });
    return {
      facilitator_id: f.id, name: f.full_name, email: f.email,
      cert_id: f.cert_id, cert_status: f.cert_status, role: f.role,
      books_certified: f.books_certified, member_since: f.created_at, last_active: f.last_active,
      cohorts_total: fCohorts.length, cohorts_active: fCohorts.filter(c => c.status === 'active').length,
      cohorts_completed: fCompleted.length,
      participants_enrolled: enrolled, participants_completed: compl,
      completion_rate: enrolled > 0 ? Math.round((compl / enrolled) * 100) : null,
      avg_outcome_rating: ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
      critical_incidents: incidents,
    };
  });

  const activeFacs   = facilitators.filter(f => f.cert_status === 'active').length;
  const expiredFacs  = facilitators.filter(f => f.cert_status === 'expired').length;
  const maxFacs      = org.max_facilitators ?? null;

  let orgEnrolled = 0, orgCompl = 0, orgRatingSum = 0, orgRated = 0, orgIncidents = 0;
  cohorts.forEach(c => {
    const o    = outcomesMap[c.id];
    const logs = logsMap[c.id] ?? [];
    orgEnrolled  += o?.pre_participant_count ?? c.participant_count ?? 0;
    orgCompl     += o?.post_participant_count ?? 0;
    orgIncidents += logs.filter(l => l.critical_incident).length;
    if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
      orgRatingSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
      orgRated++;
    }
  });

  const now = new Date();
  const licenseEnd = org.license_end ? new Date(org.license_end) : null;
  const daysToRenewal = licenseEnd ? Math.ceil((licenseEnd.getTime() - now.getTime()) / 86400000) : null;

  return NextResponse.json({
    generated_at: new Date().toISOString(), scope: 'organization',
    organization: {
      id: org.id, name: org.name, type: org.type,
      location: { city: org.city, state: org.state },
      contact: { name: org.contact_name, email: org.contact_email },
      license_start: org.license_start, license_end: org.license_end,
      days_to_renewal: daysToRenewal, status: org.status,
      renewal_count: org.renewal_count ?? 0, member_since: org.created_at,
    },
    license_utilization: {
      active_facilitators: activeFacs, expired_facilitators: expiredFacs,
      total_facilitators: facilitators.length, max_facilitators: maxFacs,
      utilization_pct: maxFacs ? Math.round((activeFacs / maxFacs) * 100) : null,
    },
    org_totals: {
      cohorts_total: cohorts.length,
      cohorts_active: cohorts.filter(c => c.status === 'active').length,
      cohorts_completed: cohorts.filter(c => c.status === 'completed').length,
      participants_enrolled: orgEnrolled, participants_completed: orgCompl,
      org_completion_rate: orgEnrolled > 0 ? Math.round((orgCompl / orgEnrolled) * 100) : null,
      avg_outcome_rating: orgRated > 0 ? Math.round((orgRatingSum / orgRated) * 10) / 10 : null,
      total_critical_incidents: orgIncidents,
    },
    facilitators: facilitatorBreakdowns,
  });
}
