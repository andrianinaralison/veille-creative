-- 180-64 : fondation data du pivot Explorer
--   - liaison N-N Reference ↔ Section (remplace Reference.sectionId 1-N)
--   - Section.type (AUTO|MANUAL), défaut MANUAL → les 9 sections existantes deviennent MANUAL
--   - Reference.awards[] (prix → bandeau modale C4)
-- Idempotent (migrate deploy, pas de shadow DB).

-- 1. Enum SectionType
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SectionType') THEN
    CREATE TYPE "SectionType" AS ENUM ('AUTO', 'MANUAL');
  END IF;
END
$$;

-- 2. Section.type — les sections existantes héritent du défaut MANUAL
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "type" "SectionType" NOT NULL DEFAULT 'MANUAL';

-- 3. Reference.awards
ALTER TABLE "Reference" ADD COLUMN IF NOT EXISTS "awards" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 4. Table de liaison N-N
CREATE TABLE IF NOT EXISTS "ReferenceSection" (
  "referenceId" TEXT NOT NULL,
  "sectionId"   TEXT NOT NULL,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "ReferenceSection_pkey" PRIMARY KEY ("referenceId", "sectionId"),
  CONSTRAINT "ReferenceSection_referenceId_fkey" FOREIGN KEY ("referenceId")
    REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferenceSection_sectionId_fkey" FOREIGN KEY ("sectionId")
    REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ReferenceSection_sectionId_position_idx"
  ON "ReferenceSection"("sectionId", "position");

ALTER TABLE "ReferenceSection" ENABLE ROW LEVEL SECURITY;

-- 5. Backfill : reprendre les assignations 1-N existantes dans la table de liaison.
--    Idempotent via ON CONFLICT. Guardé par l'existence de la colonne sectionId
--    (re-jouable après le DROP de l'étape 6).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Reference' AND column_name = 'sectionId'
  ) THEN
    INSERT INTO "ReferenceSection" ("referenceId", "sectionId")
    SELECT "id", "sectionId" FROM "Reference" WHERE "sectionId" IS NOT NULL
    ON CONFLICT ("referenceId", "sectionId") DO NOTHING;
  END IF;
END
$$;

-- 6. Retrait de l'ancienne relation 1-N
DROP INDEX IF EXISTS "Reference_sectionId_idx";
ALTER TABLE "Reference" DROP COLUMN IF EXISTS "sectionId";
