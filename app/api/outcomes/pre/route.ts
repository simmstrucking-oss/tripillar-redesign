import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyOutcomeSubmission } from '@/lib/outcomes-notify';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { cohortId, email, lossType, timeSinceLoss, priorSupport, scores, openHope } = body;

  if (!cohortId || !email || !scores) {
    return NextResponse.json({ error: 'cohortId, email, and scores required' }, { status: 400 });
  }

  const supabase = sb();
  const { data: cohort } = await supabase.from('cohorts').select('id, book_number, start_date').eq('id', cohortId).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const { error } = await supabase.from('outcomes_pre').upsert({
    cohort_id: cohortId,
    email: email.toLowerCase().trim(),
    loss_type: lossType || null,
    time_since_loss: timeSinceLoss || null,
    prior_support: priorSupport || null,
    score_emotions: scores.emotions,
    score_disruption: scores.disruption,
    score_isolation: scores.isolation,
    score_meaning: scores.meaning,
    score_selfcare: scores.selfcare,
    score_manageability: scores.manageability,
    open_hope: openHope || null,
  }, { onConflict: 'email,cohort_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify Wayne — non-fatal
  notifyOutcomeSubmission({
    phase: 'Pre-Program',
    cohortId,
    cohortLabel: `Book ${cohort.book_number} — started ${cohort.start_date}`,
    email: email.toLowerCase().trim(),
    scores: {
      emotions:     scores.emotions,
      disruption:   scores.disruption,
      isolation:    scores.isolation,
      meaning:      scores.meaning,
      selfcare:     scores.selfcare,
      manageability: scores.manageability,
    },
    openText: {
      'What they hope to gain': openHope || null,
    },
    extras: {
      'Loss type':       lossType || null,
      'Time since loss': timeSinceLoss || null,
      'Prior support':   priorSupport || null,
    },
  }).catch(() => {/* non-fatal */});

  return NextResponse.json({ ok: true });
}
