-- Compteurs contextuels pour les empty states de TriageView
ALTER TABLE "IngestionSession"
  ADD COLUMN IF NOT EXISTS "totalFilteredByDuration" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalFilteredByRules"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalAlreadyPublished"   INTEGER NOT NULL DEFAULT 0;
