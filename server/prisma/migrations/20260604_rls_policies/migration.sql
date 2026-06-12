-- RLS policies for 180 Degrés
-- Backend uses service_role key → bypasses RLS (no impact on existing operations)
-- These policies protect against direct anon key access

-- ── Reference ─────────────────────────────────────────────────────────────────
ALTER TABLE "Reference" ENABLE ROW LEVEL SECURITY;

-- anon can only read published references (library page)
CREATE POLICY "reference_public_read" ON "Reference"
  FOR SELECT
  TO anon
  USING (status = 'PUBLISHED');

-- authenticated users same as anon for now (no user-owned references yet)
CREATE POLICY "reference_authenticated_read" ON "Reference"
  FOR SELECT
  TO authenticated
  USING (status = 'PUBLISHED');

-- ── Section ───────────────────────────────────────────────────────────────────
ALTER TABLE "Section" ENABLE ROW LEVEL SECURITY;

-- anon/authenticated can only read active sections
CREATE POLICY "section_public_read" ON "Section"
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "section_authenticated_read" ON "Section"
  FOR SELECT
  TO authenticated
  USING (active = true);

-- ── Creator ───────────────────────────────────────────────────────────────────
ALTER TABLE "Creator" ENABLE ROW LEVEL SECURITY;
-- No public access — admin only via service_role

-- ── IngestionSession ──────────────────────────────────────────────────────────
ALTER TABLE "IngestionSession" ENABLE ROW LEVEL SECURITY;
-- No public access — admin only via service_role
