-- 180-67 : mécanique Save — table SavedReference (vivier perso, geste pivot)
--   - clé (userId, referenceId), unique → idempotence du save
--   - savedAt pour l'ordre « plus récent d'abord » en Bibliothèque
--   - userTags[]/note : annotations privées créées ici, câblées en 180-74
-- Scopée user au niveau applicatif (where { userId }), comme Project.
-- Idempotent (migrate deploy, pas de shadow DB).

CREATE TABLE IF NOT EXISTS "SavedReference" (
  "userId"      TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "savedAt"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "userTags"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "note"        TEXT NOT NULL DEFAULT '',

  CONSTRAINT "SavedReference_pkey" PRIMARY KEY ("userId", "referenceId"),
  CONSTRAINT "SavedReference_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SavedReference_referenceId_fkey" FOREIGN KEY ("referenceId")
    REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SavedReference_userId_savedAt_idx"
  ON "SavedReference"("userId", "savedAt" DESC);

-- Cohérence avec les autres tables : RLS activé (le serveur passe en service role,
-- donc bypass ; le scopage réel est appliqué par la couche route via userId).
ALTER TABLE "SavedReference" ENABLE ROW LEVEL SECURITY;
