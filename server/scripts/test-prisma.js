/**
 * Script de validation Prisma — itération 1
 * Usage : node scripts/test-prisma.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Test Prisma — 180 Degrés\n');

  // 1. Connexion
  console.log('📡 Connexion à la base...');
  await prisma.$connect();
  console.log('✅ Connexion OK');

  // 2. Compter les tables
  const [refs, sessions, creators] = await Promise.all([
    prisma.reference.count(),
    prisma.ingestionSession.count(),
    prisma.creator.count(),
  ]);

  console.log(`\n📊 État de la base :`);
  console.log(`   Reference      : ${refs} ligne(s)`);
  console.log(`   IngestionSession : ${sessions} ligne(s)`);
  console.log(`   Creator        : ${creators} ligne(s)`);

  // 3. Test d'écriture / lecture / suppression
  console.log('\n✏️  Test CRUD...');
  const test = await prisma.reference.create({
    data: {
      url: 'https://test.example.com/prisma-test',
      platform: 'YOUTUBE',
      title: '[TEST] Validation Prisma',
      sourceMode: 'MANUAL',
      status: 'DRAFT',
    },
  });
  console.log(`   ✅ Création OK — id: ${test.id}`);

  await prisma.reference.delete({ where: { id: test.id } });
  console.log(`   ✅ Suppression OK`);

  console.log('\n🎉 Prisma opérationnel. Itération 1 validée.');
}

main()
  .catch(e => {
    console.error('❌', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
