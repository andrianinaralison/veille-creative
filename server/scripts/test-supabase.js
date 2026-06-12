/**
 * Script de test Supabase Storage
 * Usage : node scripts/test-supabase.js
 *
 * Ce script vérifie :
 *  1. La connexion au projet Supabase
 *  2. L'accès au bucket "thumbnails"
 *  3. Un vrai upload depuis YouTube (thumbnail de test)
 *  4. L'URL publique CDN retournée
 */

import 'dotenv/config';
import { downloadAndStore, checkStorageConnection } from '../src/services/thumbnail.service.js';

// Vidéo de test : "We Are Sales Conference 2022" — déjà dans nos mock data
const TEST_VIDEO_ID = 'BOG_CbEDhag';

async function main() {
  console.log('🔧 Test Supabase Storage — 180 Degrés\n');

  // 1. Vérifier les variables d'env
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('❌ Variables manquantes dans .env :', missing.join(', '));
    console.error('   → Ajoute SUPABASE_URL et SUPABASE_SERVICE_KEY dans server/.env');
    process.exit(1);
  }
  console.log('✅ Variables d\'env présentes');
  console.log('   SUPABASE_URL :', process.env.SUPABASE_URL);
  console.log('   SUPABASE_SERVICE_KEY : eyJ...' + process.env.SUPABASE_SERVICE_KEY.slice(-6));

  // 2. Connexion bucket
  console.log('\n📦 Vérification du bucket "thumbnails"...');
  try {
    await checkStorageConnection();
    console.log('✅ Bucket "thumbnails" accessible');
  } catch (err) {
    console.error('❌ Bucket inaccessible :', err.message);
    console.error('   → Vérifie que le bucket "thumbnails" existe dans Supabase Storage');
    console.error('   → Et qu\'il est configuré en "Public bucket"');
    process.exit(1);
  }

  // 3. Upload de test
  console.log(`\n⬇️  Téléchargement thumbnail YouTube (videoId: ${TEST_VIDEO_ID})...`);
  try {
    const result = await downloadAndStore({
      platform: 'youtube',
      videoId: TEST_VIDEO_ID,
    });

    console.log('✅ Upload réussi !');
    console.log('   thumbnailUrl        :', result.thumbnailUrl);
    console.log('   thumbnailStorageKey :', result.thumbnailStorageKey);
    console.log('   thumbnailSourceUrl  :', result.thumbnailSourceUrl);
    console.log('\n🎉 Supabase Storage est opérationnel. Tu peux lancer le serveur.');
  } catch (err) {
    console.error('❌ Échec upload :', err.message);
    process.exit(1);
  }
}

main();
