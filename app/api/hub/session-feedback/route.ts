import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';
import { notifyWayne } from '@/lib/notify-wayne';

const getUser = (req: NextRequest) => getUserFromRequest(req);

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

// POST /api/hub/session-feedback — submit feedback
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = sb();
  const { data: profile } = await supabase.from('facilitator_profiles')
    .select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { cohort_id, session_number, participants_present, forms_collected, avg_satisfaction, themes } = body;

  // Validate required fields
  if (!cohort_id || !session_number) {
    return NextResponse.json({ error: 'cohort_id and session_number are required' }, { status: 400 });
  }
  const sn = Number(session_number);
  const pp = Number(participants_present);
  const fc = Number(forms_collected);
  const avgSat = avg_satisfaction != null ? Number(avg_satisfaction) : null;

  if (!Number.isInteger(sn) || sn < 1) {
    return NextResponse.json({ error: 'session_number must be >= 1' }, { status: 400 });
  }
  if (!Number.isInteger(pp) || pp < 0) {
    return NextResponse.json({ error: 'participants_present must be >= 0' }, { status: 400 });
  }
  if (!Number.isInteger(fc) || fc < 0) {
    return NextResponse.json({ error: 'forms_collected must be >= 0' }, { status: 400 });
  }
  if (avgSat != null && (avgSat < 1 || avgSat > 5)) {
    return NextResponse.json({ error: 'avg_satisfaction must be between 1 and 5' }, { status: 400 });
  }

  // Verify facilitator owns this cohort
  const { data: cohort } = await supabase.from('cohorts')
    .select('id').eq('id', cohort_id).eq('facilitator_id', profile.id).single();
  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const { data, error } = await supabase.from('session_feedback_submissions').insert({
    facilitator_id: profile.id,
    cohort_id,
    session_number: sn,
    participants_present: pp,
    forms_collected: fc,
    avg_satisfaction: avgSat,
    themes: themes ?? null,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify Wayne — non-fatal
  notifyWayne(
    `Session Feedback Submitted — Session ${sn}`,
    `Facilitator session feedback submitted.\n\nSession: ${sn}\nParticipants Present: ${pp}\nForms Collected: ${fc}\nAvg Satisfaction: ${avgSat ?? 'N/A'}/5\n\nThemes/Notes:\n${themes ?? 'None'}\n\nSubmitted: ${new Date().toISOString()}`
  ).catch(() => {});

  return NextResponse.json({ success: true, id: data.id });
}

// GET /api/hub/session-feedback — admin endpoint or per-cohort fetch
export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('Authorization')?.replace('Bearer ', '');
  const cohortId = req.nextUrl.searchParams.get('cohort_id');

  // Admin mode: return all submissions grouped by cohort
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
    const supabase = sb();
    const { data: submissions, error } = await supabase
      .from('session_feedback_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Compute avg by cohort
    const byCohort: Record<string, number[]> = {};
    for (const s of submissions ?? []) {
      if (s.cohort_id && s.avg_satisfaction != null) {
        if (!byCohort[s.cohort_id]) byCohort[s.cohort_id] = [];
        byCohort[s.cohort_id].push(Number(s.avg_satisfaction));
      }
    }
    const avg_by_cohort: Record<string, number> = {};
    for (const [cid, vals] of Object.entries(byCohort)) {
      avg_by_cohort[cid] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    }

    return NextResponse.json({ submissions: submissions ?? [], avg_by_cohort });
  }

  // Facilitator mode: return feedback for a specific cohort
  if (cohortId) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = sb();
    const { data: profile } = await supabase.from('facilitator_profiles')
      .select('id').eq('user_id', user.id).single();
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Verify ownership
    const { data: cohort } = await supabase.from('cohorts')
      .select('id').eq('id', cohortId).eq('facilitator_id', profile.id).single();
    if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

    const { data: feedback, error } = await supabase
      .from('session_feedback_submissions')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('session_number');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ feedback: feedback ?? [] });
  }

  return NextResponse.json({ error: 'cohort_id parameter or admin auth required' }, { status: 400 });
}
