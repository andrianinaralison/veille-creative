-- Table FilterRule : règles de filtrage persistantes par créateur
-- Permet d'éliminer la pollution connue dès le scan suivant

CREATE TABLE IF NOT EXISTS "FilterRule" (
  "id"        TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  "creatorId" TEXT NOT NULL,
  "type"      TEXT NOT NULL,    -- 'keyword_title' | 'channel_name'
  "pattern"   TEXT NOT NULL,    -- fragment insensible à la casse
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "FilterRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FilterRule_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "FilterRule_creatorId_idx" ON "FilterRule" ("creatorId");
CREATE INDEX IF NOT EXISTS "FilterRule_active_idx"    ON "FilterRule" ("active");

-- RLS : accès admin uniquement (service_role bypass, anon bloqué)
ALTER TABLE "FilterRule" ENABLE ROW LEVEL SECURITY;
