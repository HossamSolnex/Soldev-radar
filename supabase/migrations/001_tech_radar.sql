-- Migration 001: Tech & AI Radar — daily digest of tech/AI/marketing news
-- Standalone project: no auth/user table. Digests are public read, and are
-- written only by the daily GitHub Actions job using the service role key
-- (which bypasses RLS entirely). Bookmarks live client-side in localStorage.

CREATE TABLE IF NOT EXISTS tech_radar_digests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date   date NOT NULL UNIQUE,
  headline      text,
  sections      jsonb NOT NULL DEFAULT '[]',
  sources_count int DEFAULT 0,
  generated_by  text DEFAULT 'ai' CHECK (generated_by IN ('ai', 'raw')),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE tech_radar_digests ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can read digests. No insert/update/delete
-- policy is defined for anon/authenticated — writes only happen via the
-- service role key from the digest script, which bypasses RLS.
CREATE POLICY "tech_radar_digests_public_read" ON tech_radar_digests
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_tech_radar_digests_date ON tech_radar_digests (digest_date DESC);
