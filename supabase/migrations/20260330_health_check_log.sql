-- Health check log table
-- Stores every health check run for consecutive failure tracking and weekly reporting
CREATE TABLE IF NOT EXISTS health_check_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at      timestamptz NOT NULL DEFAULT now(),
  total_checks    integer     NOT NULL,
  total_failures  integer     NOT NULL DEFAULT 0,
  failure_names   text[]      NOT NULL DEFAULT '{}',
  healthy         boolean     NOT NULL DEFAULT true
);

-- Index for time-range queries (weekly brief, consecutive check)
CREATE INDEX IF NOT EXISTS idx_health_check_log_checked_at ON health_check_log (checked_at DESC);

-- No RLS needed — service role only, never exposed to public or authenticated users
-- Keep 90 days of history, prune older rows automatically
CREATE OR REPLACE FUNCTION prune_health_check_log()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM health_check_log WHERE checked_at < now() - interval '90 days';
$$;
