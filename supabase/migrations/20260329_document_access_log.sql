CREATE TABLE IF NOT EXISTS document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  document_name text NOT NULL,
  bucket text NOT NULL,
  role text,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read (no facilitator RLS needed here — all inserts via service role)
