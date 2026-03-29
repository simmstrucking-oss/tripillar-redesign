-- Add is_publicly_listed to facilitator_profiles if not exists
ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS is_publicly_listed boolean DEFAULT false;

-- Trainer document downloads log
CREATE TABLE IF NOT EXISTS trainer_document_downloads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES facilitator_profiles(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  downloaded_at timestamptz DEFAULT now(),
  ip_address text
);
ALTER TABLE trainer_document_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainers_own_downloads" ON trainer_document_downloads
  FOR ALL USING (trainer_id = (
    SELECT id FROM facilitator_profiles WHERE user_id = auth.uid()
  ));
