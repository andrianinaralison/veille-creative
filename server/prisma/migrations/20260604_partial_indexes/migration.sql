-- Partial indexes on Reference.status for curation queries
-- The full @@index([status]) covers all rows — these cover only the hot subsets
-- and include sort columns used by the admin UI (DRAFT by createdAt, PUBLISHED by publishedAt)

DROP INDEX IF EXISTS "Reference_status_idx";

CREATE INDEX "reference_draft_created_idx" ON "Reference" ("createdAt" DESC)
  WHERE status = 'DRAFT';

CREATE INDEX "reference_published_at_idx" ON "Reference" ("publishedAt" DESC)
  WHERE status = 'PUBLISHED';

-- Partial index on Creator.active — Creator Scan always filters WHERE active = true
CREATE INDEX "creator_active_name_idx" ON "Creator" ("name")
  WHERE active = true;
