/**
 * Upload thumbnails locaux → Supabase Storage + mise à jour BDD.
 * Usage : node scripts/upload-thumbnails.js
 *
 * Logique :
 *   - Lit toutes les refs dont thumbnailUrl commence par /thumbnails/
 *   - Pour chaque ref, lit le fichier depuis veille-creative/public/
 *   - Upload sur Supabase Storage dans refs/mock/{category}/{file}
 *   - Met à jour thumbnailUrl en base avec l'URL CDN publique
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'thumbnails';
const PUBLIC_DIR = path.resolve(__dirname, '../../veille-creative/public');

async function main() {
  // Récupérer toutes les refs avec un chemin local
  const refs = await prisma.reference.findMany({
    where: { thumbnailUrl: { startsWith: '/thumbnails/' } },
    select: { id: true, thumbnailUrl: true, title: true },
  });

  console.log(`\n🖼️  Upload thumbnails — ${refs.length} références à traiter\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const ref of refs) {
    const localPath = path.join(PUBLIC_DIR, ref.thumbnailUrl);

    if (!fs.existsSync(localPath)) {
      console.log(`  ⚠️  Fichier manquant : ${ref.thumbnailUrl}`);
      skipped++;
      continue;
    }

    // Clé Supabase : refs/mock/wedding/01.jpg
    const storageKey = `refs/mock${ref.thumbnailUrl}`;

    try {
      const fileBuffer = fs.readFileSync(localPath);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storageKey, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      // URL CDN publique
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storageKey);

      // Mise à jour en base
      await prisma.reference.update({
        where: { id: ref.id },
        data: { thumbnailUrl: publicUrl, thumbnailStorageKey: storageKey },
      });

      console.log(`  ✅ ${ref.thumbnailUrl} → CDN`);
      uploaded++;
    } catch (e) {
      console.log(`  ❌ ${ref.thumbnailUrl} — ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Terminé — ${uploaded} uploadés, ${skipped} ignorés`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
