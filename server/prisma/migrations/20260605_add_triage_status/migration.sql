-- Ajout du statut TRIAGE à l'enum RefStatus
-- Les nouvelles références scannées atterrissent en TRIAGE (tri rapide ≠ qualification)

ALTER TYPE "RefStatus" ADD VALUE IF NOT EXISTS 'TRIAGE';

-- Index partiel pour les références en attente de tri (requête fréquente dans le backoffice)
CREATE INDEX IF NOT EXISTS "reference_triage_created_idx" ON "Reference" ("createdAt" DESC)
  WHERE status = 'TRIAGE';

-- Mise à jour RLS : TRIAGE invisible côté anon/authenticated (même traitement que DRAFT)
-- (les policies existantes filtrent déjà sur status = 'PUBLISHED' — pas de changement requis)
