import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = 'tripillar-admin-2024';

const MIGRATION_SQL = `
ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS inner_work_reflections JSONB DEFAULT NULL;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS followup_reminder_sent BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS participant_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  kit_subscriber_id BIGINT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_pre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  loss_type TEXT,
  time_since_loss TEXT,
  prior_support TEXT,
  score_emotions INT CHECK (score_emotions BETWEEN 1 AND 10),
  score_disruption INT CHECK (score_disruption BETWEEN 1 AND 10),
  score_isolation INT CHECK (score_isolation BETWEEN 1 AND 10),
  score_meaning INT CHECK (score_meaning BETWEEN 1 AND 10),
  score_selfcare INT CHECK (score_selfcare BETWEEN 1 AND 10),
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  open_hope TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_mid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  score_emotions INT CHECK (score_emotions BETWEEN 1 AND 10),
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  score_connection INT CHECK (score_connection BETWEEN 1 AND 10),
  open_surprise TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sessions_attended INT,
  score_emotions INT CHECK (score_emotions BETWEEN 1 AND 10),
  score_disruption INT CHECK (score_disruption BETWEEN 1 AND 10),
  score_isolation INT CHECK (score_isolation BETWEEN 1 AND 10),
  score_meaning INT CHECK (score_meaning BETWEEN 1 AND 10),
  score_selfcare INT CHECK (score_selfcare BETWEEN 1 AND 10),
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  score_program_helpful INT CHECK (score_program_helpful BETWEEN 1 AND 10),
  score_safety INT CHECK (score_safety BETWEEN 1 AND 10),
  score_facilitator_support INT CHECK (score_facilitator_support BETWEEN 1 AND 10),
  open_change TEXT,
  open_recommend TEXT,
  open_improve TEXT,
  followup_consent BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_followup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  open_reflection TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);
`;

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] ?? '';

  // Attempt execution via Supabase's REST endpoint
  const pgRes = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'X-Connection-Type': 'sql',
    },
    body: JSON.stringify({ query: MIGRATION_SQL }),
  });

  if (pgRes.ok) {
    return NextResponse.json({ ok: true, message: 'Migration executed successfully' });
  }

  // Fallback: return SQL for manual execution
  return NextResponse.json({
    ok: false,
    message:
      'Automatic execution not available. Run this SQL in the Supabase Dashboard SQL Editor.',
    dashboard_url: `https://supabase.com/dashboard/project/${ref}/sql/new`,
    sql: MIGRATION_SQL,
  });
}
