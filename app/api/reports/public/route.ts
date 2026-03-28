import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let memCache: { data: object; expires: number } | null = null;

async function buildPublicMetrics() {
  const sb = getSupabaseServer();

  // Check metrics_cache table first
  const { data: cached } = await sb.from('metrics_cache')
    .select('key, value, updated_at')
    .in('key', ['participants_served', 'cohorts_completed', 'facilitators_certified', 'organizations_licensed'])
    .order('updated_at', { ascending: false });

  if (cached && cached.length === 4) {
    const cacheTime = new Date(cached[0].updated_at).getTime();
    if (Date.now() - cacheTime < CACHE_TTL_MS) {
      const metrics: Record<string, number> = {};
      cached.forEach(c => { metrics[c.key] = Number(c.value) ?? 0; });
      return {
        source: 'cache',
        cached_at: cached[0].updated_at,
        participants_served:      metrics['participants_served']     ?? 0,
        cohorts_completed:        metrics['cohorts_completed']       ?? 0,
        facilitators_certified:   metrics['facilitators_certified']  ?? 0,
        organizations_licensed:   metrics['organizations_licensed']  ?? 0,
      };
    }
  }

  // Cache miss — compute live
  const [
    { data: completedCohorts },
    { data: activeFacilitators },
    { data: activeOrgs },
  ] = await Promise.all([
    sb.from('cohorts').select('id').eq('status', 'completed'),
    sb.from('facilitator_profiles').select('id').eq('cert_status', 'active'),
    sb.from('organizations').select('id').eq('status', 'active'),
  ]);

  // Sum participants_completed from cohort_outcomes for completed cohorts
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

  // Write to metrics_cache (upsert each key)
  const now = new Date().toISOString();
  await Promise.all(
    Object.entries(metrics).map(([key, value]) =>
      sb.from('metrics_cache').upsert(
        { key, value: String(value), updated_at: now },
        { onConflict: 'key' }
      )
    )
  );

  return { source: 'live', cached_at: now, ...metrics };
}

// GET /api/reports/public — no auth required
export async function GET(_req: NextRequest) {
  // In-memory cache layer (avoids DB hit within same server instance)
  if (memCache && Date.now() < memCache.expires) {
    return NextResponse.json(memCache.data, {
      headers: { 'Cache-Control': 'public, max-age=3600', 'X-Cache': 'HIT' },
    });
  }

  const data = await buildPublicMetrics();
  memCache = { data, expires: Date.now() + CACHE_TTL_MS };

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=3600', 'X-Cache': 'MISS' },
  });
}
