CREATE TABLE IF NOT EXISTS session_feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id uuid NOT NULL REFERENCES facilitator_profiles(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  session_number integer NOT NULL,
  participants_present integer NOT NULL,
  forms_collected integer NOT NULL,
  avg_satisfaction numeric(3,1) CHECK (avg_satisfaction >= 1 AND avg_satisfaction <= 5),
  themes text,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE session_feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facilitators_read_own_feedback" ON session_feedback_submissions
  FOR SELECT USING (
    facilitator_id IN (SELECT id FROM facilitator_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "facilitators_insert_own_feedback" ON session_feedback_submissions
  FOR INSERT WITH CHECK (
    facilitator_id IN (SELECT id FROM facilitator_profiles WHERE user_id = auth.uid())
  );
