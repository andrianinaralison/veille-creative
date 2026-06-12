-- 180-21 : projets / treatments — CRUD scopé utilisateur + items commentés

CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'DONE');

CREATE TABLE IF NOT EXISTS "Project" (
  "id"         TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  "userId"     TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "client"     TEXT NOT NULL DEFAULT '',
  "brief"      TEXT NOT NULL DEFAULT '',
  "intention"  TEXT NOT NULL DEFAULT '',
  "status"     "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
  "deadline"   TIMESTAMPTZ(6),
  "shareToken" TEXT,
  "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Project_shareToken_key" ON "Project"("shareToken");
CREATE INDEX IF NOT EXISTS "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt" DESC);

CREATE TABLE IF NOT EXISTS "ProjectItem" (
  "id"          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  "projectId"   TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "note"        TEXT NOT NULL DEFAULT '',

  CONSTRAINT "ProjectItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectItem_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectItem_referenceId_fkey" FOREIGN KEY ("referenceId")
    REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectItem_projectId_referenceId_key" ON "ProjectItem"("projectId", "referenceId");
CREATE INDEX IF NOT EXISTS "ProjectItem_projectId_position_idx" ON "ProjectItem"("projectId", "position");

ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectItem" ENABLE ROW LEVEL SECURITY;
