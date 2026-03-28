import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('lg-admin-session')?.value;
  const header = req.headers.get('x-admin-secret');
  return cookie === process.env.ADMIN_SECRET || header === process.env.ADMIN_SECRET;
}

function monthKey(dateStr: string): string {
  return dateStr?.slice(0, 7) ?? 'unknown';
}
function quarterKey(dateStr: string): string {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
}

// GET /api/reports/program — Wayne only
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden: program scope is admin-only' }, { status: 403 });

  const sb = getSupabaseServer();

  // --- Pull everything ---
  const [
    { data: orgs },
    { data: facilitators },
    { data: cohorts },
    { data: outcomes },
    { data: sessionLogs },
    { data: soloSessions },
    { data: purchases },
    { data: trackerRatings },
  ] = await Promise.all([
    sb.from('organizations').select('id, name, type, state, city, status, license_start, license_end, max_facilitators, created_at'),
    sb.from('facilitator_profiles').select('id, organization_id, cert_status, role, cert_issued, books_certified, last_active, created_at'),
    sb.from('cohorts').select('id, facilitator_id, book_number, status, start_date, end_date, participant_count'),
    sb.from('cohort_outcomes').select('cohort_id, pre_participant_count, post_participant_count, completion_rate, post_grief_intensity_rating, post_connection_rating, post_self_care_rating, post_hope_rating, pre_setting_type, pre_community_type, pre_primary_loss_types, pre_age_ranges, pre_time_since_loss, post_submitted_at'),
    sb.from('session_logs').select('cohort_id, week_number, participants_attended, session_duration_minutes, critical_incident, session_date'),
    sb.from('session_progress').select('user_id, current_week, sections_completed, session_count, duration_minutes, last_active_week, last_updated'),
    sb.from('purchases').select('id, created_at, amount, currency, payment_type, subscription_status'),
    sb.from('tracker_ratings').select('week_number, grief_intensity, connection, self_care, hope, recorded_at'),
  ]);

  // Build maps
  const outcomesMap: Record<string, typeof outcomes extends (infer T)[] | null ? T : never> = {};
  (outcomes ?? []).forEach(o => { if (o) outcomesMap[o.cohort_id] = o; });

  const logsMap: Record<string, typeof sessionLogs extends (infer T)[] | null ? T[] : never[]> = {};
  (sessionLogs ?? []).forEach(l => {
    if (!l) return;
    if (!logsMap[l.cohort_id]) logsMap[l.cohort_id] = [];
    logsMap[l.cohort_id].push(l);
  });

  const facMap: Record<string, typeof facilitators extends (infer T)[] | null ? T : never> = {};
  (facilitators ?? []).forEach(f => { if (f) facMap[f.id] = f; });

  const orgMap: Record<string, typeof orgs extends (infer T)[] | null ? T : never> = {};
  (orgs ?? []).forEach(o => { if (o) orgMap[o.id] = o; });

  // ── Overall counts ──────────────────────────────────────
  const allCohorts   = cohorts ?? [];
  const allFacs      = facilitators ?? [];
  const allOrgs      = orgs ?? [];
  const completedCohorts = allCohorts.filter(c => c.status === 'completed');

  let totalEnrolled = 0, totalCompleted = 0, ratingSum = 0, ratedCount = 0, incidents = 0;
  allCohorts.forEach(c => {
    const o    = outcomesMap[c.id];
    const logs = logsMap[c.id] ?? [];
    totalEnrolled  += o?.pre_participant_count ?? c.participant_count ?? 0;
    totalCompleted += o?.post_participant_count ?? 0;
    incidents      += logs.filter(l => l.critical_incident).length;
    if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
      ratingSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
      ratedCount++;
    }
  });

  // ── Monthly time series ─────────────────────────────────
  const monthlyMap: Record<string, { cohorts_started: number; cohorts_completed: number; participants_enrolled: number; participants_completed: number }> = {};
  allCohorts.forEach(c => {
    const startKey = monthKey(c.start_date ?? '');
    if (!monthlyMap[startKey]) monthlyMap[startKey] = { cohorts_started: 0, cohorts_completed: 0, participants_enrolled: 0, participants_completed: 0 };
    monthlyMap[startKey].cohorts_started++;
    monthlyMap[startKey].participants_enrolled += outcomesMap[c.id]?.pre_participant_count ?? c.participant_count ?? 0;

    if (c.status === 'completed' && c.end_date) {
      const endKey = monthKey(c.end_date);
      if (!monthlyMap[endKey]) monthlyMap[endKey] = { cohorts_started: 0, cohorts_completed: 0, participants_enrolled: 0, participants_completed: 0 };
      monthlyMap[endKey].cohorts_completed++;
      monthlyMap[endKey].participants_completed += outcomesMap[c.id]?.post_participant_count ?? 0;
    }
  });
  const monthlyTimeSeries = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  // ── Quarterly time series ───────────────────────────────
  const quarterlyMap: Record<string, { cohorts_started: number; cohorts_completed: number; participants_enrolled: number }> = {};
  allCohorts.forEach(c => {
    const qk = quarterKey(c.start_date ?? '');
    if (!quarterlyMap[qk]) quarterlyMap[qk] = { cohorts_started: 0, cohorts_completed: 0, participants_enrolled: 0 };
    quarterlyMap[qk].cohorts_started++;
    quarterlyMap[qk].participants_enrolled += outcomesMap[c.id]?.pre_participant_count ?? c.participant_count ?? 0;
    if (c.status === 'completed') quarterlyMap[qk].cohorts_completed++;
  });
  const quarterlyTimeSeries = Object.entries(quarterlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([quarter, v]) => ({ quarter, ...v }));

  // ── Geographic distribution ─────────────────────────────
  const stateMap: Record<string, { orgs: number; facilitators: number; cohorts: number; participants: number }> = {};
  allOrgs.forEach(o => {
    const state = o.state ?? 'Unknown';
    if (!stateMap[state]) stateMap[state] = { orgs: 0, facilitators: 0, cohorts: 0, participants: 0 };
    stateMap[state].orgs++;
  });
  allFacs.forEach(f => {
    const orgState = f.organization_id ? (orgMap[f.organization_id]?.state ?? 'Unknown') : 'Unaffiliated';
    if (!stateMap[orgState]) stateMap[orgState] = { orgs: 0, facilitators: 0, cohorts: 0, participants: 0 };
    stateMap[orgState].facilitators++;
  });
  allCohorts.forEach(c => {
    const fac = facMap[c.facilitator_id];
    const orgState = fac?.organization_id ? (orgMap[fac.organization_id]?.state ?? 'Unknown') : 'Unaffiliated';
    if (!stateMap[orgState]) stateMap[orgState] = { orgs: 0, facilitators: 0, cohorts: 0, participants: 0 };
    stateMap[orgState].cohorts++;
    stateMap[orgState].participants += outcomesMap[c.id]?.pre_participant_count ?? c.participant_count ?? 0;
  });
  const geographicData = Object.entries(stateMap)
    .sort(([, a], [, b]) => b.participants - a.participants)
    .map(([state, v]) => ({ state, ...v }));

  // ── Rural vs urban outcomes ─────────────────────────────
  const communityOutcomes: Record<string, { count: number; totalRate: number; totalRating: number; rated: number }> = {};
  completedCohorts.forEach(c => {
    const o = outcomesMap[c.id];
    if (!o) return;
    const ct = o.pre_community_type ?? 'unknown';
    if (!communityOutcomes[ct]) communityOutcomes[ct] = { count: 0, totalRate: 0, totalRating: 0, rated: 0 };
    communityOutcomes[ct].count++;
    if (o.completion_rate) communityOutcomes[ct].totalRate += o.completion_rate;
    if (o.post_grief_intensity_rating && o.post_connection_rating && o.post_self_care_rating && o.post_hope_rating) {
      communityOutcomes[ct].totalRating += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
      communityOutcomes[ct].rated++;
    }
  });
  const ruralVsUrbanOutcomes = Object.entries(communityOutcomes).map(([type, v]) => ({
    community_type: type,
    cohorts: v.count,
    avg_completion_rate: v.count > 0 ? Math.round(v.totalRate / v.count) : null,
    avg_outcome_rating:  v.rated > 0 ? Math.round((v.totalRating / v.rated) * 10) / 10 : null,
  }));

  // ── Loss type distribution ──────────────────────────────
  const lossTypeTotals: Record<string, number> = {};
  (outcomes ?? []).forEach(o => {
    if (!o?.pre_primary_loss_types) return;
    Object.entries(o.pre_primary_loss_types).forEach(([k, v]) => {
      lossTypeTotals[k] = (lossTypeTotals[k] ?? 0) + Number(v);
    });
  });
  const lossTypeDistribution = Object.entries(lossTypeTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ loss_type: type, count }));

  // ── Book progression rate ───────────────────────────────
  const bookCounts: Record<number, { started: number; completed: number }> = {};
  allCohorts.forEach(c => {
    const b = c.book_number;
    if (!bookCounts[b]) bookCounts[b] = { started: 0, completed: 0 };
    bookCounts[b].started++;
    if (c.status === 'completed') bookCounts[b].completed++;
  });
  const bookProgressionRate = Object.entries(bookCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([book, v]) => ({
      book_number: Number(book),
      cohorts_started: v.started,
      cohorts_completed: v.completed,
      completion_rate: v.started > 0 ? Math.round((v.completed / v.started) * 100) : null,
    }));

  // ── Facilitator tenure effect ───────────────────────────
  // Group facilitators by how long they've been certified; compare avg outcome
  const tenureBuckets: Record<string, { count: number; ratingSum: number; rated: number }> = {
    'under_6mo': { count: 0, ratingSum: 0, rated: 0 },
    '6_12mo':    { count: 0, ratingSum: 0, rated: 0 },
    '1_2yr':     { count: 0, ratingSum: 0, rated: 0 },
    '2yr_plus':  { count: 0, ratingSum: 0, rated: 0 },
  };
  const now = Date.now();
  allFacs.forEach(f => {
    if (!f.cert_issued) return;
    const monthsTenure = (now - new Date(f.cert_issued).getTime()) / (1000 * 60 * 60 * 24 * 30);
    const bucket = monthsTenure < 6 ? 'under_6mo' : monthsTenure < 12 ? '6_12mo' : monthsTenure < 24 ? '1_2yr' : '2yr_plus';
    const fCohorts = allCohorts.filter(c => c.facilitator_id === f.id && c.status === 'completed');
    fCohorts.forEach(c => {
      const o = outcomesMap[c.id];
      if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
        tenureBuckets[bucket].count++;
        tenureBuckets[bucket].ratingSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
        tenureBuckets[bucket].rated++;
      }
    });
  });
  const facilitatorTenureEffect = Object.entries(tenureBuckets).map(([tenure, v]) => ({
    tenure,
    cohorts_completed: v.count,
    avg_outcome_rating: v.rated > 0 ? Math.round((v.ratingSum / v.rated) * 10) / 10 : null,
  }));

  // ── Solo Companion metrics ──────────────────────────────
  const soloUsers          = soloSessions ?? [];
  const soloCompletedWeek13 = soloUsers.filter(s => (s.current_week ?? 0) >= 13).length;
  const avgWeekReached     = soloUsers.length > 0
    ? Math.round(soloUsers.reduce((s, u) => s + (u.current_week ?? 0), 0) / soloUsers.length * 10) / 10
    : null;
  const avgSessionCount    = soloUsers.length > 0
    ? Math.round(soloUsers.reduce((s, u) => s + (u.session_count ?? 0), 0) / soloUsers.length * 10) / 10
    : null;
  const avgDuration        = soloUsers.length > 0
    ? Math.round(soloUsers.reduce((s, u) => s + (u.duration_minutes ?? 0), 0) / soloUsers.length)
    : null;

  // Solo tracker avg by week
  const trackerByWeek: Record<number, { count: number; griefSum: number; connectionSum: number; selfCareSum: number; hopeSum: number }> = {};
  (trackerRatings ?? []).forEach(t => {
    if (!t) return;
    const w = t.week_number;
    if (!trackerByWeek[w]) trackerByWeek[w] = { count: 0, griefSum: 0, connectionSum: 0, selfCareSum: 0, hopeSum: 0 };
    trackerByWeek[w].count++;
    trackerByWeek[w].griefSum      += t.grief_intensity ?? 0;
    trackerByWeek[w].connectionSum += t.connection ?? 0;
    trackerByWeek[w].selfCareSum   += t.self_care ?? 0;
    trackerByWeek[w].hopeSum       += t.hope ?? 0;
  });
  const soloTrackerByWeek = Object.entries(trackerByWeek)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([week, v]) => ({
      week: Number(week),
      responses: v.count,
      avg_grief:      v.count > 0 ? Math.round((v.griefSum / v.count) * 10) / 10 : null,
      avg_connection: v.count > 0 ? Math.round((v.connectionSum / v.count) * 10) / 10 : null,
      avg_self_care:  v.count > 0 ? Math.round((v.selfCareSum / v.count) * 10) / 10 : null,
      avg_hope:       v.count > 0 ? Math.round((v.hopeSum / v.count) * 10) / 10 : null,
    }));

  // ── Financial health ────────────────────────────────────
  const allPurchases = purchases ?? [];
  const oneTimePurchases = allPurchases.filter(p => p.payment_type === 'one_time');
  const subscriptionPurchases = allPurchases.filter(p => p.payment_type === 'subscription');
  const totalRevenue = allPurchases.reduce((s, p) => s + (p.amount ?? 0), 0);
  const activeSubscriptions = subscriptionPurchases.filter(p => p.subscription_status === 'active').length;

  const revenueByMonth: Record<string, number> = {};
  allPurchases.forEach(p => {
    const mk = monthKey(p.created_at ?? '');
    revenueByMonth[mk] = (revenueByMonth[mk] ?? 0) + (p.amount ?? 0);
  });
  const revenueTimeSeries = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue_cents: revenue }));

  // ── Org license health ──────────────────────────────────
  const now2 = new Date();
  const orgsExpiringSoon = allOrgs.filter(o => {
    if (!o.license_end) return false;
    const days = (new Date(o.license_end).getTime() - now2.getTime()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 60;
  }).length;
  const orgsExpired = allOrgs.filter(o => {
    if (!o.license_end) return false;
    return new Date(o.license_end) < now2;
  }).length;

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    scope: 'program',
    program_overview: {
      organizations_total:       allOrgs.length,
      organizations_active:      allOrgs.filter(o => o.status === 'active').length,
      organizations_expiring_60d: orgsExpiringSoon,
      organizations_expired:     orgsExpired,
      facilitators_total:        allFacs.length,
      facilitators_active:       allFacs.filter(f => f.cert_status === 'active').length,
      facilitators_expired:      allFacs.filter(f => f.cert_status === 'expired').length,
      cohorts_total:             allCohorts.length,
      cohorts_active:            allCohorts.filter(c => c.status === 'active').length,
      cohorts_completed:         completedCohorts.length,
      participants_enrolled:     totalEnrolled,
      participants_completed:    totalCompleted,
      overall_completion_rate:   totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : null,
      avg_outcome_rating:        ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
      total_critical_incidents:  incidents,
    },
    time_series: {
      monthly:   monthlyTimeSeries,
      quarterly: quarterlyTimeSeries,
    },
    geographic_data:         geographicData,
    rural_vs_urban_outcomes: ruralVsUrbanOutcomes,
    loss_type_distribution:  lossTypeDistribution,
    book_progression_rate:   bookProgressionRate,
    facilitator_tenure_effect: facilitatorTenureEffect,
    solo_companion: {
      total_users:           soloUsers.length,
      completed_program:     soloCompletedWeek13,
      completion_rate:       soloUsers.length > 0 ? Math.round((soloCompletedWeek13 / soloUsers.length) * 100) : null,
      avg_week_reached:      avgWeekReached,
      avg_sessions_per_user: avgSessionCount,
      avg_total_minutes:     avgDuration,
      tracker_by_week:       soloTrackerByWeek,
    },
    financial: {
      total_revenue_cents:    totalRevenue,
      one_time_purchases:     oneTimePurchases.length,
      active_subscriptions:   activeSubscriptions,
      total_purchases:        allPurchases.length,
      revenue_by_month:       revenueTimeSeries,
    },
  });
}
