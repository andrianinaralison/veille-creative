/**
 * Seed — importe les références mock dans la base Supabase via Prisma.
 * Usage : node scripts/seed-mock-data.js
 *
 * Idempotent : utilise upsert sur `url` — safe à relancer.
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// Importer le mockData depuis le frontend (chemin relatif)
const mockPath = path.resolve(__dirname, '../../veille-creative/src/data/mockData.js');
const { mockReferences } = await import(pathToFileURL(mockPath).href);

function toPlatform(str) {
  const map = { youtube: 'YOUTUBE', vimeo: 'VIMEO', web: 'WEB' };
  return map[(str ?? '').toLowerCase()] ?? 'YOUTUBE';
}

async function main() {
  console.log(`\n🌱 Seed — ${mockReferences.length} références à importer\n`);

  let created = 0;
  let skipped = 0;

  for (const ref of mockReferences) {
    const platform = toPlatform(ref.platform);

    try {
      const result = await prisma.reference.upsert({
        where: { url: ref.url },
        update: {
          title: ref.title,
          channelName: ref.author ?? '',
          tags: ref.tags ?? [],
          mood: ref.mood ?? null,
          context: ref.context ?? '',
          thumbnailUrl: ref.thumbnail ?? '',
          status: 'DRAFT',
        },
        create: {
          url: ref.url,
          platform,
          sourceMode: 'MANUAL',
          title: ref.title,
          channelName: ref.author ?? '',
          tags: ref.tags ?? [],
          mood: ref.mood ?? null,
          context: ref.context ?? '',
          thumbnailUrl: ref.thumbnail ?? '',
          status: 'DRAFT',
          ...(ref.savedAt ? { createdAt: new Date(ref.savedAt) } : {}),
        },
      });

      console.log(`  ✅ ${result.id.slice(0, 8)}… ${ref.title.slice(0, 60)}`);
      created++;
    } catch (e) {
      console.log(`  ⚠️  skip ${ref.id} — ${e.message.slice(0, 80)}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Seed terminé — ${created} insérées/mises à jour, ${skipped} erreurs`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
