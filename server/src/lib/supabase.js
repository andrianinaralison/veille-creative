/**
 * Client Supabase — singleton partagé dans tout le serveur.
 *
 * On utilise la SERVICE ROLE key (pas l'anon key) :
 *  - Bypass Row Level Security → upload depuis le serveur sans restriction
 *  - Ne jamais exposer cette clé côté client/frontend
 *
 * Variables d'env requises :
 *  SUPABASE_URL          → https://xxxx.supabase.co
 *  SUPABASE_SERVICE_KEY  → eyJ... (Settings → API → service_role)
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error(
    'Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env'
  );
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false }, // serveur Node, pas de session côté client
  }
);
