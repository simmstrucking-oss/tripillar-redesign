import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

function avg(rows: Record<string, unknown>[], key: string): number | null {
  const vals = rows.map(r => r[key]).filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cohort_id = req.nextUrl.searchParams.get('cohort_id');
  if (!cohort_id) return NextResponse.json({ error: 'cohort_id required' }, { status: 400 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data: cohort } = await supabase.from('cohorts')
    .select('id').eq('id', cohort_id).eq('facilitator_id', profile.id).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const [regRes, preRes, midRes, postRes, fuRes] = await Promise.all([
    supabase.from('participant_registrations').select('id').eq('cohort_id', cohort_id),
    supabase.from('outcomes_pre').select('*').eq('cohort_id', cohort_id),
    supabase.from('outcomes_mid').select('*').eq('cohort_id', cohort_id),
    supabase.from('outcomes_post').select('*').eq('cohort_id', cohort_id),
    supabase.from('outcomes_followup').select('*').eq('cohort_id', cohort_id),
  ]);

  const pre = preRes.data ?? [];
  const mid = midRes.data ?? [];
  const post = postRes.data ?? [];
  const followup = fuRes.data ?? [];

  return NextResponse.json({
    participant_count: regRes.data?.length ?? 0,
    pre: {
      count: pre.length,
      avg_emotions: avg(pre, 'score_emotions'),
      avg_disruption: avg(pre, 'score_disruption'),
      avg_isolation: avg(pre, 'score_isolation'),
      avg_meaning: avg(pre, 'score_meaning'),
      avg_selfcare: avg(pre, 'score_selfcare'),
      avg_manageability: avg(pre, 'score_manageability'),
    },
    mid: {
      count: mid.length,
      avg_emotions: avg(mid, 'score_emotions'),
      avg_manageability: avg(mid, 'score_manageability'),
      avg_connection: avg(mid, 'score_connection'),
    },
    post: {
      count: post.length,
      avg_emotions: avg(post, 'score_emotions'),
      avg_disruption: avg(post, 'score_disruption'),
      avg_isolation: avg(post, 'score_isolation'),
      avg_meaning: avg(post, 'score_meaning'),
      avg_selfcare: avg(post, 'score_selfcare'),
      avg_manageability: avg(post, 'score_manageability'),
      avg_program_helpful: avg(post, 'score_program_helpful'),
      avg_safety: avg(post, 'score_safety'),
      avg_facilitator_support: avg(post, 'score_facilitator_support'),
    },
    followup: {
      count: followup.length,
      avg_manageability: avg(followup, 'score_manageability'),
    },
  });
}
