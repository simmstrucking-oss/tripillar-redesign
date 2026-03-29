CREATE TABLE IF NOT EXISTS critical_incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id uuid NOT NULL REFERENCES facilitator_profiles(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  incident_date date NOT NULL,
  session_number integer,
  description text NOT NULL CHECK (char_length(description) <= 1000),
  action_taken text,
  followup_planned text,
  participant_status text NOT NULL CHECK (participant_status IN ('Stable', 'Referred to professional', 'Unknown', '911 called')),
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE critical_incident_reports ENABLE ROW LEVEL SECURITY;

-- Facilitators read own rows only
CREATE POLICY "facilitators_read_own_incidents" ON critical_incident_reports
  FOR SELECT USING (
    facilitator_id IN (
      SELECT id FROM facilitator_profiles WHERE user_id = auth.uid()
    )
  );

-- Facilitators insert own rows only
CREATE POLICY "facilitators_insert_own_incidents" ON critical_incident_reports
  FOR INSERT WITH CHECK (
    facilitator_id IN (
      SELECT id FROM facilitator_profiles WHERE user_id = auth.uid()
    )
  );
