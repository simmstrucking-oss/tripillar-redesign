import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { cohortId, email, sessionsAttended, scores, open, followupConsent } = body;

  if (!cohortId || !email || !scores) {
    return NextResponse.json({ error: 'cohortId, email, and scores required' }, { status: 400 });
  }

  const supabase = sb();
  const { data: cohort } = await supabase.from('cohorts').select('id').eq('id', cohortId).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const { error } = await supabase.from('outcomes_post').upsert({
    cohort_id: cohortId,
    email: email.toLowerCase().trim(),
    sessions_attended: sessionsAttended ? Number(sessionsAttended) : null,
    score_emotions: scores.emotions,
    score_disruption: scores.disruption,
    score_isolation: scores.isolation,
    score_meaning: scores.meaning,
    score_selfcare: scores.selfcare,
    score_manageability: scores.manageability,
    score_program_helpful: scores.helpful,
    score_safety: scores.safety,
    score_facilitator_support: scores.facilitatorSupport,
    open_change: open?.change || null,
    open_recommend: open?.recommend || null,
    open_improve: open?.improve || null,
    followup_consent: followupConsent ?? false,
  }, { onConflict: 'email,cohort_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
