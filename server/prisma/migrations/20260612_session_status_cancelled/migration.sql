-- Ajoute la valeur CANCELLED à l'enum SessionStatus
-- Idempotent : ne fait rien si la valeur existe déjà
DO $$ BEGIN
  ALTER TYPE "SessionStatus" ADD VALUE 'CANCELLED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
