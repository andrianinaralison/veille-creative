/**
 * Thumbnail Service — 180 Degrés
 *
 * Responsabilités :
 *  1. Télécharger la thumbnail depuis la source (YouTube CDN, Vimeo CDN, URL custom)
 *  2. L'uploader dans le bucket Supabase Storage "thumbnails"
 *  3. Retourner l'URL publique CDN + la clé de stockage
 *
 * Convention de nommage dans le bucket :
 *   refs/youtube/{videoId}.jpg
 *   refs/vimeo/{videoId}.jpg
 *   refs/web/{hash}.jpg
 */

import { supabase } from '../lib/supabase.js';
import crypto from 'crypto';

const BUCKET = 'thumbnails';

// ─── Résolution thumbnail YouTube ────────────────────────────────────────────
// YouTube expose plusieurs qualités — on essaie du mieux au moins bien.
const YT_QUALITIES = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];

async function fetchYouTubeThumbnail(videoId) {
  for (const quality of YT_QUALITIES) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      // YouTube retourne une image 120×90 grise pour les qualités manquantes
      // On vérifie le Content-Length pour détecter ça
      const contentLength = Number(res.headers.get('content-length') ?? 0);
      if (contentLength < 5000 && quality !== 'mqdefault') continue; // trop petite = placeholder

      const buffer = await res.arrayBuffer();
      return Buffer.from(buffer);
    } catch {
      continue;
    }
  }
  throw new Error(`Impossible de récupérer la thumbnail YouTube pour videoId: ${videoId}`);
}

// ─── Résolution thumbnail générique (Vimeo, web) ─────────────────────────────
async function fetchGenericThumbnail(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': '180Degres-Bot/1.0' },
  });
  if (!res.ok) throw new Error(`Fetch thumbnail failed: ${res.status} ${url}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

// ─── Upload vers Supabase Storage ────────────────────────────────────────────
async function uploadToSupabase(buffer, storageKey) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, buffer, {
      contentType: 'image/jpeg',
      upsert: true, // écrase si déjà existant (re-run de la même ref)
      cacheControl: '31536000', // 1 an — les thumbnails ne changent pas
    });

  if (error) throw new Error(`Supabase Storage upload error: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
  return data.publicUrl;
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Télécharge et stocke la thumbnail d'une référence.
 *
 * @param {Object} params
 * @param {'youtube'|'vimeo'|'web'} params.platform
 * @param {string} params.videoId      - Pour YouTube/Vimeo
 * @param {string} [params.sourceUrl]  - URL directe de la thumbnail (Vimeo, web)
 *
 * @returns {{ thumbnailUrl: string, thumbnailStorageKey: string, thumbnailSourceUrl: string }}
 */
export async function downloadAndStore({ platform, videoId, sourceUrl }) {
  let buffer;
  let storageKey;
  let resolvedSourceUrl = sourceUrl;

  if (platform === 'youtube') {
    buffer = await fetchYouTubeThumbnail(videoId);
    storageKey = `refs/youtube/${videoId}.jpg`;
    resolvedSourceUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  } else if (platform === 'vimeo') {
    if (!sourceUrl) throw new Error('sourceUrl requis pour Vimeo');
    buffer = await fetchGenericThumbnail(sourceUrl);
    storageKey = `refs/vimeo/${videoId}.jpg`;
  } else {
    // Web / custom
    if (!sourceUrl) throw new Error('sourceUrl requis pour platform web');
    buffer = await fetchGenericThumbnail(sourceUrl);
    const hash = crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 12);
    storageKey = `refs/web/${hash}.jpg`;
  }

  const thumbnailUrl = await uploadToSupabase(buffer, storageKey);

  return {
    thumbnailUrl,           // URL CDN publique Supabase → stockée en BDD
    thumbnailStorageKey: storageKey, // pour suppression future
    thumbnailSourceUrl: resolvedSourceUrl,   // URL d'origine → fallback
  };
}

// ─── Test / health check ─────────────────────────────────────────────────────

/**
 * Vérifie que le bucket "thumbnails" est accessible.
 * À appeler au démarrage du serveur pour fail-fast si Supabase mal configuré.
 */
export async function checkStorageConnection() {
  const { error } = await supabase.storage.from(BUCKET).list('', { limit: 1 });
  if (error) throw new Error(`Supabase Storage inaccessible: ${error.message}`);
  return true;
}
