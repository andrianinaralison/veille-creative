-- Make url nullable (YouTube handle is now the primary identifier)
ALTER TABLE "Creator" ALTER COLUMN "url" DROP NOT NULL;

-- Add new profile fields
ALTER TABLE "Creator" ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;
ALTER TABLE "Creator" ADD COLUMN IF NOT EXISTS "vimeoUrl" TEXT;

-- Set default for platform
ALTER TABLE "Creator" ALTER COLUMN "platform" SET DEFAULT 'YOUTUBE';

-- Migrate existing instagramUrl → instagramHandle (keep URL as-is for now)
UPDATE "Creator" SET "instagramHandle" = "instagramUrl" WHERE "instagramUrl" IS NOT NULL;
