/**
 * POST /api/reports/generate
 * Unified report generation endpoint — types: cohort | org | quarterly | annual
 * Body: { type, entity_id, force? }
 * Returns: { url, path, cached, generated_at }
 *
 * Auth:
 *   cohort   — facilitator (own) | org_admin (own org) | admin
 *   org      — org_admin (own org) | admin
 *   quarterly / annual — admin only
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getOrGenerateReport, invalidateReportCache } from '@/lib/pdf/storage';
import { buildCohortSummaryPDF }  from '@/lib/pdf/reports/cohort-summary';
import { buildOrgProgramPDF }     from '@/lib/pdf/reports/org-program';
import { buildQuarterlyPDF }      from '@/lib/pdf/reports/quarterly';
import { buildAnnualImpactPDF }   from '@/lib/pdf/reports/annual-impact';
import { getUserFromRequest } from '@/lib/auth-helper';

function isAdmin(req: NextRequest) {
  const cookie   = req.cookies.get('lg-admin-session')?.value;
  const header   = req.headers.get('x-admin-secret');
  const internal = req.headers.get('x-org-report-internal');
  return (
    cookie   === process.env.ADMIN_SECRET ||
    header   === process.env.ADMIN_SECRET ||
    (process.env.INTERNAL_SECRET && internal === process.env.INTERNAL_SECRET)
  );
}

async function getCallerProfile(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const sb = getSupabaseServer();
  const { data } = await sb.from('facilitator_profiles').select('id, role, organization_id').eq('user_id', user.id).single();
  if (!data) return null;
  if (user.email === 'wayne@tripillarstudio.com' || user.email === 'jamie@tripillarstudio.com') {
    return { ...data, role: 'admin' };
  }
  return data;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    type,
    // entity_id is the canonical param; org_id is accepted as alias for org reports
    entity_id: _entity_id,
    org_id,
    force = false,
    year,
    quarter,
    date_from,
    date_to,
  } = body as {
    type:       string;
    entity_id?: string;
    org_id?:    string;
    force?:     boolean;
    year?:      number;
    quarter?:   string;
    date_from?: string;
    date_to?:   string;
  };
  // Normalize: 'organization' → 'org'; alias org_id → entity_id
  const normalizedType = type === 'organization' ? 'org' : type;
  const entity_id      = _entity_id ?? org_id;
  void date_from; void date_to; // accepted but not used yet (date-range filtering is future work)
  const _type = normalizedType;

  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

  const admin   = isAdmin(req);
  const profile = admin ? null : await getCallerProfile(req);
  if (!admin && !profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb  = getSupabaseServer();
  const now = new Date().toISOString();

  // ── COHORT SUMMARY ────────────────────────────────────────────────────────
  if (_type === 'cohort') {
    if (!entity_id) return NextResponse.json({ error: 'entity_id (cohort_id) required' }, { status: 400 });

    // Auth: facilitator can only generate for their own cohorts
    if (!admin) {
      const { data: cohort } = await sb.from('cohorts').select('facilitator_id').eq('id', entity_id).single();
      if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      if (profile!.role === 'facilitator' && cohort.facilitator_id !== profile!.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (profile!.role === 'org_admin') {
        const { data: fac } = await sb.from('facilitator_profiles').select('organization_id').eq('id', cohort.facilitator_id).single();
        if (fac?.organization_id !== profile!.organization_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (force) await invalidateReportCache('cohort', entity_id);

    const result = await getOrGenerateReport('cohort', entity_id, 'cohort-summary', async () => {
      // Pull all data needed for cohort summary
      const [
        { data: cohort },
        { data: facProfile },
        { data: outcome },
        { data: logs },
      ] = await Promise.all([
        sb.from('cohorts').select('*').eq('id', entity_id).single(),
        sb.from('facilitator_profiles').select('full_name, cert_id, organization_id').eq('id',
          (await sb.from('cohorts').select('facilitator_id').eq('id', entity_id).single()).data?.facilitator_id ?? ''
        ).single(),
        sb.from('cohort_outcomes').select('*').eq('cohort_id', entity_id).single(),
        sb.from('session_logs').select('*').eq('cohort_id', entity_id).order('week_number'),
      ]);

      let orgName: string | null = null;
      if (facProfile?.organization_id) {
        const { data: org } = await sb.from('organizations').select('name').eq('id', facProfile.organization_id).single();
        orgName = org?.name ?? null;
      }

      return buildCohortSummaryPDF({
        facilitator_name:           facProfile?.full_name ?? 'Unknown',
        facilitator_cert_id:        facProfile?.cert_id ?? '—',
        organization_name:          orgName,
        cohort_id:                  entity_id,
        book_number:                cohort?.book_number ?? 1,
        start_date:                 cohort?.start_date ?? null,
        end_date:                   cohort?.end_date ?? null,
        pre_participant_count:      outcome?.pre_participant_count ?? cohort?.participant_count ?? null,
        pre_setting_type:           outcome?.pre_setting_type ?? null,
        pre_community_type:         outcome?.pre_community_type ?? null,
        pre_primary_loss_types:     outcome?.pre_primary_loss_types ?? null,
        pre_age_ranges:             outcome?.pre_age_ranges ?? null,
        pre_time_since_loss:        outcome?.pre_time_since_loss ?? null,
        pre_prior_support:          outcome?.pre_prior_support ?? null,
        session_logs: (logs ?? []).map(l => ({
          week_number:          l.week_number,
          session_date:         l.session_date,
          session_duration_min: l.session_duration_minutes,
          participants_attended: l.participants_attended,
          group_stable:         l.group_composition_stable,
          co_facilitated:       l.co_facilitated,
          critical_incident:    l.critical_incident,
        })),
        post_participant_count:      outcome?.post_participant_count ?? null,
        completion_rate:             outcome?.completion_rate ?? null,
        post_grief_intensity_rating: outcome?.post_grief_intensity_rating ?? null,
        post_connection_rating:      outcome?.post_connection_rating ?? null,
        post_self_care_rating:       outcome?.post_self_care_rating ?? null,
        post_hope_rating:            outcome?.post_hope_rating ?? null,
        facilitator_observations:    outcome?.facilitator_observations ?? null,
        generated_at:                now,
      });
    });

    return NextResponse.json({ ok: true, ...result });
  }

  // ── ORG PROGRAM ──────────────────────────────────────────────────────────
  if (_type === 'org') {
    if (!entity_id) return NextResponse.json({ error: 'entity_id (org_id) required' }, { status: 400 });

    if (!admin) {
      if (profile!.role === 'facilitator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (profile!.role === 'org_admin' && profile!.organization_id !== entity_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (force) await invalidateReportCache('org', entity_id);

    const result = await getOrGenerateReport('org', entity_id, 'org-report', async () => {
      const { data: org }  = await sb.from('organizations').select('*').eq('id', entity_id).single();
      const { data: facs } = await sb.from('facilitator_profiles').select('*').eq('organization_id', entity_id);
      const facIds = (facs ?? []).map(f => f.id);
      const { data: cohorts } = facIds.length
        ? await sb.from('cohorts').select('*').in('facilitator_id', facIds)
        : { data: [] as any[] };
      const cohortIds = (cohorts ?? []).map((c: any) => c.id);
      const { data: outcomes } = cohortIds.length
        ? await sb.from('cohort_outcomes').select('*').in('cohort_id', cohortIds)
        : { data: [] as any[] };

      const outMap: Record<string, any> = {};
      (outcomes ?? []).forEach(o => { if (o) outMap[o.cohort_id] = o; });
      const coMap: Record<string, any[]> = {};
      (cohorts ?? []).forEach(c => {
        if (!c) return;
        if (!coMap[c.facilitator_id]) coMap[c.facilitator_id] = [];
        coMap[c.facilitator_id].push(c);
      });

      const facBreakdowns = (facs ?? []).map(f => {
        const fc = coMap[f.id] ?? [];
        let enrolled = 0, compl = 0, rSum = 0, rN = 0, inc = 0;
        fc.forEach(c => {
          const o = outMap[c.id];
          enrolled += o?.pre_participant_count ?? c.participant_count ?? 0;
          compl    += o?.post_participant_count ?? 0;
          inc      += 0;
          if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
            rSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
            rN++;
          }
        });
        return {
          name: f.full_name, cert_id: f.cert_id, cert_status: f.cert_status,
          cohorts_completed: fc.filter(c => c.status === 'completed').length,
          cohorts_active:    fc.filter(c => c.status === 'active').length,
          participants_enrolled: enrolled, participants_completed: compl,
          completion_rate: enrolled > 0 ? Math.round((compl / enrolled) * 100) : null,
          avg_outcome_rating: rN > 0 ? Math.round((rSum / rN) * 10) / 10 : null,
          critical_incidents: inc,
          books_certified: f.books_certified ?? [],
        };
      });

      const allCohorts = cohorts ?? [];
      let tE = 0, tC = 0, tRS = 0, tRN = 0;
      allCohorts.forEach(c => {
        const o = outMap[c.id];
        tE += o?.pre_participant_count ?? c.participant_count ?? 0;
        tC += o?.post_participant_count ?? 0;
        if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
          tRS += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
          tRN++;
        }
      });

      return buildOrgProgramPDF({
        org_name:            org?.name ?? 'Unknown',
        org_type:            org?.type ?? null,
        location:            [org?.city, org?.state].filter(Boolean).join(', ') || null,
        license_start:       org?.license_start ?? null,
        license_end:         org?.license_end ?? null,
        renewal_count:       org?.renewal_count ?? 0,
        active_facilitators: (facs ?? []).filter(f => f.cert_status === 'active').length,
        max_facilitators:    org?.max_facilitators ?? null,
        facilitators:        facBreakdowns,
        total_cohorts:       allCohorts.length,
        active_cohorts:      allCohorts.filter(c => c.status === 'active').length,
        completed_cohorts:   allCohorts.filter(c => c.status === 'completed').length,
        total_enrolled:      tE, total_completed: tC,
        org_completion_rate: tE > 0 ? Math.round((tC / tE) * 100) : null,
        avg_outcome_rating:  tRN > 0 ? Math.round((tRS / tRN) * 10) / 10 : null,
        total_incidents:     0,
        generated_at:        now,
      });
    });

    return NextResponse.json({ ok: true, ...result });
  }

  // ── QUARTERLY ────────────────────────────────────────────────────────────
  if (_type === 'quarterly') {
    if (!admin) return NextResponse.json({ error: 'Forbidden: quarterly reports are admin-only' }, { status: 403 });
    const q       = quarter ?? 'Q?';
    const entityKey = `quarterly-${year ?? new Date().getFullYear()}-${q}`;
    if (force) await invalidateReportCache('quarterly', entityKey);

    const result = await getOrGenerateReport('quarterly', entityKey, 'quarterly-report', async () => {
      // Pull data for the specified quarter/year — simplified aggregation
      const thisYear  = year ?? new Date().getFullYear();
      const quarterNum = parseInt((q ?? 'Q1').replace('Q', ''));
      const startMonth = (quarterNum - 1) * 3 + 1;
      const start = `${thisYear}-${String(startMonth).padStart(2, '0')}-01`;
      const endMonth = quarterNum * 3;
      const lastDay = new Date(thisYear, endMonth, 0).getDate();
      const end   = `${thisYear}-${String(endMonth).padStart(2, '0')}-${lastDay}`;

      const { data: qCohorts } = await sb.from('cohorts')
        .select('*').gte('start_date', start).lte('start_date', end);
      const qIds = (qCohorts ?? []).map(c => c.id);
      const { data: qOutcomes } = qIds.length ? await sb.from('cohort_outcomes').select('*').in('cohort_id', qIds) : { data: [] };

      let tE = 0, tC = 0, rSum = 0, rN = 0;
      (qCohorts ?? []).forEach(c => {
        const o = (qOutcomes ?? []).find(x => x.cohort_id === c.id);
        tE += o?.pre_participant_count ?? c.participant_count ?? 0;
        tC += o?.post_participant_count ?? 0;
        if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
          rSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
          rN++;
        }
      });

      const { data: newFacs } = await sb.from('facilitator_profiles').select('id').gte('created_at', start).lte('created_at', end);
      const { data: allFacs } = await sb.from('facilitator_profiles').select('id').eq('cert_status', 'active');
      const { data: allOrgs } = await sb.from('organizations').select('id').eq('status', 'active');

      return buildQuarterlyPDF({
        quarter: `${q} ${thisYear}`,
        start_date: start, end_date: end,
        orgs_active: (allOrgs ?? []).length,
        facs_active: (allFacs ?? []).length,
        facs_new:    (newFacs ?? []).length,
        cohorts_started:   (qCohorts ?? []).length,
        cohorts_completed: (qCohorts ?? []).filter(c => c.status === 'completed').length,
        cohorts_active:    (qCohorts ?? []).filter(c => c.status === 'active').length,
        participants_enrolled:  tE, participants_completed: tC,
        completion_rate: tE > 0 ? Math.round((tC / tE) * 100) : null,
        avg_outcome_rating: rN > 0 ? Math.round((rSum / rN) * 10) / 10 : null,
        critical_incidents: 0,
        monthly_breakdown: [],   // simplified — detailed breakdowns from /api/reports/program
        top_loss_types: [],
        setting_distribution: [],
        solo_companion: null,
        prev_quarter_comparison: null,
        generated_at: now,
      });
    });

    return NextResponse.json({ ok: true, ...result });
  }

  // ── ANNUAL ───────────────────────────────────────────────────────────────
  if (_type === 'annual') {
    if (!admin) return NextResponse.json({ error: 'Forbidden: annual reports are admin-only' }, { status: 403 });
    const yr = year ?? new Date().getFullYear() - 1;
    if (force) await invalidateReportCache('annual', String(yr));

    const result = await getOrGenerateReport('annual', String(yr), 'annual-impact', async () => {
      const start = `${yr}-01-01`;
      const end   = `${yr}-12-31`;

      const [
        { data: aCohorts },
        { data: aFacs },
        { data: aOrgs },
        { data: newFacs },
        { data: newOrgs },
      ] = await Promise.all([
        sb.from('cohorts').select('*').gte('start_date', start).lte('start_date', end),
        sb.from('facilitator_profiles').select('*').eq('cert_status', 'active'),
        sb.from('organizations').select('*').eq('status', 'active'),
        sb.from('facilitator_profiles').select('id').gte('created_at', start).lte('created_at', end),
        sb.from('organizations').select('id').gte('created_at', start).lte('created_at', end),
      ]);

      const aIds = (aCohorts ?? []).map(c => c.id);
      const { data: aOutcomes } = aIds.length ? await sb.from('cohort_outcomes').select('*').in('cohort_id', aIds) : { data: [] };

      let tE = 0, tC = 0, rSum = 0, rN = 0;
      (aCohorts ?? []).forEach(c => {
        const o = (aOutcomes ?? []).find(x => x.cohort_id === c.id);
        tE += o?.pre_participant_count ?? c.participant_count ?? 0;
        tC += o?.post_participant_count ?? 0;
        if (o?.post_grief_intensity_rating && o?.post_connection_rating && o?.post_self_care_rating && o?.post_hope_rating) {
          rSum += (o.post_grief_intensity_rating + o.post_connection_rating + o.post_self_care_rating + o.post_hope_rating) / 4;
          rN++;
        }
      });

      const bookProg: Record<number, { s: number; c: number }> = {};
      (aCohorts ?? []).forEach(c => {
        if (!bookProg[c.book_number]) bookProg[c.book_number] = { s: 0, c: 0 };
        bookProg[c.book_number].s++;
        if (c.status === 'completed') bookProg[c.book_number].c++;
      });

      return buildAnnualImpactPDF({
        year:         yr,
        narrative_intro:   '',
        narrative_impact:  '',
        narrative_forward: '',
        orgs_total:   (aOrgs ?? []).length,
        orgs_new:     (newOrgs ?? []).length,
        facs_total:   (aFacs ?? []).length,
        facs_new:     (newFacs ?? []).length,
        cohorts_total:      (aCohorts ?? []).length,
        cohorts_completed:  (aCohorts ?? []).filter(c => c.status === 'completed').length,
        participants_served:   tC,
        participants_enrolled: tE,
        completion_rate: tE > 0 ? Math.round((tC / tE) * 100) : null,
        avg_outcome_rating: rN > 0 ? Math.round((rSum / rN) * 10) / 10 : null,
        total_incidents: 0,
        quarterly_breakdown: [],
        top_loss_types: [],
        geographic_states: 0,
        top_states: [],
        setting_distribution: [],
        book_progression: Object.entries(bookProg).map(([b, v]) => ({
          book_number: Number(b), cohorts_started: v.s, cohorts_completed: v.c,
        })),
        solo_companion: null,
        is_draft: true,
        generated_at: now,
      });
    });

    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 });
}
