-- 180-16 : table User pour l'auth utilisateurs (signup / login / me)
CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "firstName"    TEXT NOT NULL DEFAULT '',
  "createdAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- RLS : même posture que les autres tables — le backend passe par service_role,
-- aucun accès anon direct
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
