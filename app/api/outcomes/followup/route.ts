import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyOutcomeSubmission } from '@/lib/outcomes-notify';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { cohortId, email, scoreManageability, openReflection } = body;

  if (!cohortId || !email) {
    return NextResponse.json({ error: 'cohortId and email required' }, { status: 400 });
  }

  const supabase = sb();
  const { data: cohort } = await supabase.from('cohorts').select('id, book_number, start_date').eq('id', cohortId).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const { error } = await supabase.from('outcomes_followup').upsert({
    cohort_id: cohortId,
    email: email.toLowerCase().trim(),
    score_manageability: scoreManageability,
    open_reflection: openReflection || null,
  }, { onConflict: 'email,cohort_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify Wayne — non-fatal
  notifyOutcomeSubmission({
    phase: '90-Day Follow-Up',
    cohortId,
    cohortLabel: `Book ${cohort.book_number} — started ${cohort.start_date}`,
    email: email.toLowerCase().trim(),
    scores: {
      manageability: scoreManageability,
    },
    openText: {
      '90-day reflection': openReflection || null,
    },
  }).catch(() => {/* non-fatal */});

  return NextResponse.json({ ok: true });
}
