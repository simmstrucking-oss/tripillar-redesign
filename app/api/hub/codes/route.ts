import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

export const runtime = 'edge';

const getUser = (req: NextRequest) => getUserFromRequest(req);

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/hub/codes          — list batches for this facilitator (with redeemed counts)
// GET /api/hub/codes?batch_id — return individual codes for one batch
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = svc();
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const url      = new URL(req.url);
  const batchId  = url.searchParams.get('batch_id');

  if (batchId) {
    // Return individual codes for one batch
    const { data: codes, error } = await supabase
      .from('access_codes')
      .select('id, code, status, redeemed_at, redeemed_by_email')
      .eq('batch_id', batchId)
      .eq('facilitator_id', profile.id)
      .order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ codes });
  }

  // Return all batches with redeemed counts
  const { data: batches, error: bErr } = await supabase
    .from('access_code_batches')
    .select('id, book_number, batch_size, expires_at, created_at, notes, cohort_id')
    .eq('facilitator_id', profile.id)
    .order('created_at', { ascending: false });

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  // Fetch redeemed counts per batch
  const batchIds = (batches ?? []).map((b: { id: string }) => b.id);
  let redeemedMap: Record<string, number> = {};
  if (batchIds.length > 0) {
    const { data: counts } = await supabase
      .from('access_codes')
      .select('batch_id, status')
      .in('batch_id', batchIds)
      .eq('status', 'redeemed');
    (counts ?? []).forEach((r: { batch_id: string }) => {
      redeemedMap[r.batch_id] = (redeemedMap[r.batch_id] ?? 0) + 1;
    });
  }

  // Resolve cohort names
  const cohortIds = [...new Set((batches ?? []).map((b: { cohort_id?: string }) => b.cohort_id).filter(Boolean))] as string[];
  let cohortNames: Record<string, string> = {};
  if (cohortIds.length > 0) {
    const { data: cohortRows } = await supabase
      .from('cohorts')
      .select('id, book_number, start_date, end_date, notes')
      .in('id', cohortIds);
    (cohortRows ?? []).forEach((c: { id: string; book_number: number; start_date: string; end_date?: string; notes?: string }) => {
      cohortNames[c.id] = `Book ${c.book_number}${c.end_date ? ` ends ${c.end_date}` : ''}${c.notes ? ` — ${c.notes}` : ''}`;
    });
  }

  const enriched = (batches ?? []).map((b: { id: string; cohort_id?: string }) => ({
    ...b,
    redeemed_count: redeemedMap[b.id] ?? 0,
    _cohort_name:   b.cohort_id ? cohortNames[b.cohort_id] : undefined,
  }));

  return NextResponse.json({ batches: enriched });
}
