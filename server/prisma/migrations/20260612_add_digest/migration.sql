-- 180-19 : modèle éditorial Digest (sélection hebdo + intro) + items ordonnés

CREATE TYPE "DigestStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE IF NOT EXISTS "Digest" (
  "id"          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  "weekOf"      DATE NOT NULL,
  "title"       TEXT NOT NULL,
  "intro"       TEXT NOT NULL DEFAULT '',
  "status"      "DigestStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ(6),
  "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "Digest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Digest_weekOf_key" ON "Digest"("weekOf");
CREATE INDEX IF NOT EXISTS "Digest_status_weekOf_idx" ON "Digest"("status", "weekOf" DESC);

CREATE TABLE IF NOT EXISTS "DigestItem" (
  "id"          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  "digestId"    TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "note"        TEXT NOT NULL DEFAULT '',

  CONSTRAINT "DigestItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DigestItem_digestId_fkey" FOREIGN KEY ("digestId")
    REFERENCES "Digest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DigestItem_referenceId_fkey" FOREIGN KEY ("referenceId")
    REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DigestItem_digestId_referenceId_key" ON "DigestItem"("digestId", "referenceId");
CREATE INDEX IF NOT EXISTS "DigestItem_digestId_position_idx" ON "DigestItem"("digestId", "position");

-- RLS : même posture que les autres tables
ALTER TABLE "Digest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DigestItem" ENABLE ROW LEVEL SECURITY;
