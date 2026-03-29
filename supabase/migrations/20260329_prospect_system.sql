-- Task 9 Part A: Prospect System Tables & RLS Setup
-- Created: 2026-03-29

-- 1. Prospects table
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  sector text NOT NULL,
  notes text,
  status text DEFAULT 'active',
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- 2. Prospect codes table
CREATE TABLE IF NOT EXISTS prospect_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  sector text NOT NULL,
  expiry_days integer,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  used_by_email text,
  status text DEFAULT 'active'
);

-- 3. Prospect activity table
CREATE TABLE IF NOT EXISTS prospect_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  code_id uuid REFERENCES prospect_codes(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- 4. Prospect call requests table
CREATE TABLE IF NOT EXISTS prospect_call_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  code_id uuid REFERENCES prospect_codes(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  org_name text NOT NULL,
  phone text NOT NULL,
  preferred_time text,
  message text,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'new'
);

-- 5. Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  org_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_title text,
  org_address text,
  org_state text,
  license_tier text NOT NULL,
  license_fee numeric(10,2),
  books_licensed text[],
  license_start_date date,
  license_renewal_date date,
  status text DEFAULT 'sent',
  test_mode boolean DEFAULT false,
  generated_pdf_path text,
  final_pdf_path text,
  org_signature text,
  org_signed_at timestamptz,
  wayne_signature text,
  wayne_signed_at timestamptz,
  sent_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 6. Enable RLS on all tables
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_call_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies - Service role full access
CREATE POLICY "Service role full access" ON prospects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prospect_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prospect_activity FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prospect_call_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON agreements FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospect_codes_code ON prospect_codes(code);
CREATE INDEX IF NOT EXISTS idx_prospect_codes_prospect_id ON prospect_codes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_activity_prospect_id ON prospect_activity(prospect_id);
CREATE INDEX IF NOT EXISTS idx_agreements_token ON agreements(token);
