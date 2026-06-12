-- 180-20 : envoi email du digest — opt-in utilisateur + horodatage d'envoi
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "digestOptIn" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Digest" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMPTZ(6);
