/**
 * Ingestion Service — 180 Degrés
 *
 * Pipeline :
 *  1. Claude API → convertit le brief NL en requêtes YouTube ciblées + metadata
 *  2. YouTube search.list → liste de vidéos candidates (filtres natifs API)
 *  3. YouTube videos.list → enrichissement (description, channelId, stats)
 *  4. Filtre minViews → écarte les vidéos en dessous du seuil
 *  5. Claude scoring pass → score 0-100 par vidéo, garde >= 65
 *  6. Claude enrichissement → tags taxonomie + mood + typeContenu + context
 *  7. YouTube channels.list → avatar du créateur
 *  8. Thumbnail → downloadAndStore → Supabase CDN
 *  9. Prisma upsert → Reference DRAFT en BDD
 * 10. IngestionSession mise à jour en continu
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';
import { downloadAndStore } from './thumbnail.service.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const YT_KEY = process.env.YOUTUBE_API_KEY;

// ─── Taxonomie partagée (prompt caching) ─────────────────────────────────────

const TAG_TAXONOMY = `
**ambiance** : cinématique, épuré, dramatique, romantique, luxe, intime, mélancolique, nostalgique, épique, mystérieux, joyeux, poétique, élégant, sombre, énergique, rêveur, brut, sensuel, sérieux, authentique

**colorimetrie** : chaud, froid, teal-orange, désaturé, contrasté, pastel, monochrome, film-grain, vintage, moody-dark, natural-light, high-key, low-key, rose-tinted, vert-forêt, sépia

**narration** : émotionnel, rythmé, beat-sync, contemplatif, documentaire, voix-off, non-linéaire, poétique, flashback, jump-cuts, long-takes, slow-burn, punch-cuts, transitions-créatives

**format_image** : 16-9, 2.35-scope, 2.39-ultra-scope, 1.85, open-gate, 4-3, 1-1-carré, 9-16-vertical, 6-5, super8-16mm

**type_contenu** : mariage, corporate, événementiel, publicité-ads, documentaire, court-métrage, clip-musical, portrait, fashion-lifestyle, sport-action, gastronomie, immobilier, travel-voyage, nature, engagement-couple

**camera** : sony-fx3, sony-fx6, sony-fx9, sony-a7siii, sony-a1, sony-zve1, canon-c70, canon-c300iii, canon-r5c, bmpcc4k, bmpcc6k, bm-ursa, lumix-s5ii, lumix-s1h, red-komodo, red-monstro, arri-alexa, dji-ronin4d, iphone-smartphone, gopro-action

**optique** : anamorphique, sphérique, prime, zoom, macro, grand-angle, téléobjectif, vintage-dezoomé, tilt-shift, fisheye

**technique_tournage** : handheld, gimbal-stabilisé, trépied, drone-aérien, fpv, steadicam, slider, jib-grue, sous-marin, caméra-embarquée, macro, timelapse, hyperlapse, slow-motion, double-exposition, tilt-shift, 360

**mouvement_camera** : statique, panoramique, travelling-avant, travelling-arrière, travelling-latéral, push-in, pull-out, rotation, plongée, contre-plongée, dutch-angle, low-angle, high-angle, crane-up, crane-down, zoom-optique, dézoom

**cadrage** : plan-large, plan-ensemble, plan-moyen, plan-américain, plan-rapproché, gros-plan, insert-détail, pov-subjectif, over-the-shoulder, two-shot, birds-eye, worms-eye, symétrique, règle-des-tiers, cadre-dans-cadre, leading-lines, silhouette

**eclairage** : natural-light, golden-hour, blue-hour, midi-lumière-dure, nuit-low-light, contre-jour, backlight, studio, softbox, lumière-dure, fenêtre, feu-flamme, néon-led-coloré, high-key, low-key, practicals, haze-fumée, silhouette, sous-exposé-intentionnel

**lieu** : intérieur, extérieur, urbain, campagne, montagne, mer-plage, forêt, désert, château-domaine, loft-industriel, église, salle-réception, rooftop, studio, destination-international, jardin, sous-marin

**saison_meteo** : été, automne, hiver, printemps, soleil, nuageux, pluie, neige, brouillard, crépuscule

**post_production** : film-grain, light-leaks-flares, transitions-morphing, split-screen, texte-titrage, vfx-léger, color-grading-prononcé, lut-cinéma, letterbox-animé, glitch, double-exposition, slow-ramp

**nb_sujets** : solo, duo, groupe-moins-10, groupe-plus-10, foule, sans-sujet-humain

**niveau_production** : solo-one-man-band, petite-équipe-2-3, équipe-complète, production-cinéma
`.trim();

const ENRICH_SYSTEM = `Tu es un assistant d'enrichissement de métadonnées pour 180 Degrés, plateforme de veille créative pour vidéastes indépendants français.

Pour chaque vidéo (titre, chaîne, description, tags YouTube), extrait :
- tags : jusqu'à 8 slugs de notre taxonomie, uniquement ceux clairement visibles dans le titre ou la description
- mood : l'ambiance dominante (un seul slug de la catégorie "ambiance") ou null
- typeContenu : type de contenu (un seul slug de "type_contenu") ou null
- context : 1 phrase en français décrivant ce qui rend cette vidéo intéressante comme référence créative

## TAXONOMIE
${TAG_TAXONOMY}

Règles :
- Utilise uniquement les slugs exacts de la taxonomie (minuscules, tirets)
- Pour tags : inclure type_contenu + ambiance + techniques si clairement évidents
- Pour mood : choisir dans la catégorie "ambiance" uniquement
- Pour typeContenu : choisir dans "type_contenu" uniquement
- Pour context : être concret sur la technique ou le style distinctif
- Si incertain, retourner null plutôt que deviner`;

// ─── Enrichissement Claude — tags/mood/typeContenu/context ────────────────────

async function enrichVideosBatch(videos) {
  if (!videos.length) return {};

  const BATCH = 15;
  const result = {};

  for (let i = 0; i < videos.length; i += BATCH) {
    const batch = videos.slice(i, i + BATCH);

    const videoList = batch.map((v, idx) =>
      `[${idx}] id:${v.videoId}\nTitre: ${v.title}\nChaîne: ${v.channelName}\nDescription: ${v.description?.slice(0, 400) ?? ''}\nTags YT: ${(v.tags ?? []).slice(0, 10).join(', ')}`
    ).join('\n\n---\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: ENRICH_SYSTEM,
          cache_control: { type: 'ephemeral', ttl: '1h' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Enrichis ces ${batch.length} vidéos :\n\n${videoList}\n\nRéponds UNIQUEMENT avec du JSON valide :\n{"enriched": [{"videoId": "...", "tags": [], "mood": null, "typeContenu": null, "context": "..."}]}`,
        },
      ],
    });

    const text = response.content[0]?.text ?? '';
    let enriched = [];
    try {
      enriched = JSON.parse(text).enriched ?? [];
    } catch {
      const match = text.match(/\{[\s\S]*"enriched"[\s\S]*\}/);
      if (match) enriched = JSON.parse(match[0]).enriched ?? [];
    }

    for (const entry of enriched) {
      result[entry.videoId] = {
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        mood: entry.mood ?? null,
        typeContenu: entry.typeContenu ?? null,
        context: entry.context ?? '',
      };
    }

    console.log(`[enrich] Batch ${Math.floor(i / BATCH) + 1} — ${enriched.length}/${batch.length} enrichis`);
  }

  return result;
}

// ─── Fix 1 : Claude → requêtes multi-ciblées + metadata ──────────────────────

async function generateYouTubeQueries(brief) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: `You are a YouTube search specialist for a creative video reference platform.
Convert a brief into 5 to 8 targeted YouTube search queries designed to find high-quality professional video references.

Query strategies to combine:
- Creator-specific: include known creator names directly (e.g. "Runaways Vows wedding film")
- Phrase + exclusions: use quotes for exact phrases and minus signs to exclude noise (e.g. '"wedding film" teaser 2025 -tutorial -tips -review -how -bts -behind')
- Category + year: combine content type with publication year (e.g. "cinematic wedding teaser 2025")
- Award/quality signals: add terms like "award winning", "cinematic", "4K film"

Also extract from the brief:
- publishedAfter: ISO date string (e.g. "2025-01-01T00:00:00Z"). Use the earliest acceptable date. Default to one year ago if not specified.
- minViews: minimum view count as integer. Default to 1000 if not specified.

Respond ONLY with valid JSON, no text before or after:
{"queries": ["query1", "query2", ...], "publishedAfter": "ISO_DATE", "minViews": NUMBER}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: brief }],
  });

  const text = response.content[0]?.text ?? '';
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
      return {
        queries: parsed.queries.slice(0, 8),
        publishedAfter: parsed.publishedAfter ?? oneYearAgo(),
        minViews: typeof parsed.minViews === 'number' ? parsed.minViews : 1000,
      };
    }
  } catch {
    const match = text.match(/\{[\s\S]*"queries"[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.queries)) {
        return {
          queries: parsed.queries.slice(0, 8),
          publishedAfter: parsed.publishedAfter ?? oneYearAgo(),
          minViews: typeof parsed.minViews === 'number' ? parsed.minViews : 1000,
        };
      }
    }
  }
  throw new Error(`Claude n'a pas retourné de JSON valide : ${text}`);
}

function oneYearAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

// ─── Fix 2 : YouTube search.list avec filtres natifs ─────────────────────────

async function searchYouTube(query, publishedAfter, maxResults = 10) {
  const url = new URL(`${YT_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('videoDuration', 'medium');      // 4–20 min : exclut Shorts et tutoriels longs
  url.searchParams.set('videoDefinition', 'high');      // HD uniquement
  url.searchParams.set('order', 'viewCount');           // trie par popularité
  if (publishedAfter) {
    url.searchParams.set('publishedAfter', publishedAfter);
  }
  url.searchParams.set('key', YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search.list error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return (data.items ?? []).map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelId: item.snippet.channelId,
    channelName: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

// ─── YouTube videos.list — détails complets ───────────────────────────────────

export function parseDurationSeconds(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? 0) * 3600) + (parseInt(m[2] ?? 0) * 60) + parseInt(m[3] ?? 0);
}

async function getVideoDetails(videoIds) {
  if (!videoIds.length) return [];
  const url = new URL(`${YT_BASE}/videos`);
  url.searchParams.set('part', 'snippet,statistics,contentDetails');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube videos.list error ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map(item => ({
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    channelId: item.snippet.channelId,
    channelName: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    tags: item.snippet.tags ?? [],
    viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
    durationSeconds: parseDurationSeconds(item.contentDetails?.duration),
  }));
}

// ─── YouTube channels.list — avatar créateur ─────────────────────────────────

async function getChannelAvatars(channelIds) {
  const unique = [...new Set(channelIds)].filter(Boolean);
  if (!unique.length) return {};

  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('id', unique.join(','));
  url.searchParams.set('key', YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return {};
  const data = await res.json();

  const map = {};
  for (const item of data.items ?? []) {
    map[item.id] = item.snippet?.thumbnails?.default?.url ?? '';
  }
  return map;
}

// ─── Fix 3 : Claude scoring pass — 0 à 100 ───────────────────────────────────

const SCORE_THRESHOLD = 65;

async function scoreVideosWithClaude(brief, videos) {
  if (!videos.length) return [];

  // Batch par 25 pour garder les prompts raisonnables
  const BATCH = 25;
  const kept = [];

  for (let i = 0; i < videos.length; i += BATCH) {
    const batch = videos.slice(i, i + BATCH);

    const videoList = batch.map((v, idx) =>
      `[${idx}] id:${v.videoId} | views:${v.viewCount}\nTitle: ${v.title}\nDescription: ${v.description?.slice(0, 200) ?? ''}`
    ).join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Original brief:
"${brief}"

Score each video below from 0 to 100 based on how well it matches the brief.
High score = professional cinematic video matching the brief (right type, right creator style, right era).
Low score = tutorials, tips, behind-the-scenes, commercials, unrelated content.

Videos:
${videoList}

Respond ONLY with valid JSON:
{"scores": [{"videoId": "...", "score": 0-100, "reason": "one line"}]}`,
        },
      ],
    });

    const text = response.content[0]?.text ?? '';
    let scores = [];
    try {
      const parsed = JSON.parse(text);
      scores = parsed.scores ?? [];
    } catch {
      const match = text.match(/\{[\s\S]*"scores"[\s\S]*\}/);
      if (match) {
        scores = JSON.parse(match[0]).scores ?? [];
      }
    }

    for (const video of batch) {
      const entry = scores.find(s => s.videoId === video.videoId);
      const score = entry?.score ?? 0;
      console.log(`[scoring] ${video.videoId} → ${score}/100 — ${entry?.reason ?? 'no reason'}`);
      if (score >= SCORE_THRESHOLD) {
        kept.push({ ...video, _score: score, _scoreReason: entry?.reason ?? '' });
      }
    }
  }

  return kept;
}

// ─── Helpers résolution channelId ────────────────────────────────────────────

async function resolveChannelId(input) {
  if (!input) return null;

  // Format /channel/UCxxx
  const channelMatch = input.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelMatch) return channelMatch[1];

  // Format /@handle (URL) ou @handle nu
  const handleMatch = input.match(/(?:youtube\.com\/)?@([\w.-]+)/);
  if (handleMatch) {
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set('part', 'id');
    url.searchParams.set('forHandle', handleMatch[1]);
    url.searchParams.set('key', YT_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id ?? null;
  }

  // Format /c/name (legacy)
  const legacyMatch = input.match(/youtube\.com\/c\/([\w.-]+)/);
  if (legacyMatch) {
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set('part', 'id');
    url.searchParams.set('forUsername', legacyMatch[1]);
    url.searchParams.set('key', YT_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id ?? null;
  }

  return null;
}

async function getUploadsPlaylistId(channelId) {
  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', YT_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

// Récupère tous les videoIds d'une playlist via playlistItems.list (1 quota unit/call vs 100 pour search.list)
async function getAllVideoIdsFromPlaylist(playlistId) {
  const items = [];
  let pageToken = null;

  do {
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', YT_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) break;
    const data = await res.json();

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (videoId) items.push(videoId);
    }
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);

  return items;
}

// Extrait le videoId d'une URL YouTube (formats court, long, embed)
export function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m?.[1] ?? null;
}

// ─── Agent principal ──────────────────────────────────────────────────────────

export async function runIngestionAgent(sessionId, brief) {
  const updateSession = (data) =>
    prisma.ingestionSession.update({ where: { id: sessionId }, data }).catch(console.error);

  try {
    // 1. Générer les requêtes YouTube via Claude (Fix 1)
    const { queries, publishedAfter, minViews } = await generateYouTubeQueries(brief);
    console.log(`[ingestion:${sessionId}] Queries:`, queries);
    console.log(`[ingestion:${sessionId}] publishedAfter: ${publishedAfter} | minViews: ${minViews}`);

    // 2. Recherche YouTube pour chaque requête (Fix 2)
    const rawResults = [];
    const seenIds = new Set();

    for (const q of queries) {
      try {
        const hits = await searchYouTube(q, publishedAfter, 10);
        for (const hit of hits) {
          if (!seenIds.has(hit.videoId)) {
            seenIds.add(hit.videoId);
            rawResults.push(hit);
          }
        }
      } catch (err) {
        console.warn(`[ingestion:${sessionId}] Query "${q}" failed:`, err.message);
      }
    }

    console.log(`[ingestion:${sessionId}] Found ${rawResults.length} unique videos`);

    // 3. Enrichissement via videos.list (par batch de 50)
    const enriched = [];
    for (let i = 0; i < rawResults.length; i += 50) {
      const batch = rawResults.slice(i, i + 50);
      const details = await getVideoDetails(batch.map(r => r.videoId));
      enriched.push(...details);
    }

    await updateSession({ totalFound: enriched.length });

    // 4. Filtre minViews (Fix 2 — après enrichissement)
    const aboveMinViews = enriched.filter(v => v.viewCount >= minViews);
    console.log(`[ingestion:${sessionId}] After minViews (${minViews}): ${aboveMinViews.length}/${enriched.length}`);

    // 5. Scoring Claude — double passe (Fix 3)
    const scored = await scoreVideosWithClaude(brief, aboveMinViews);
    console.log(`[ingestion:${sessionId}] After Claude scoring (>=${SCORE_THRESHOLD}): ${scored.length}/${aboveMinViews.length}`);

    await prisma.ingestionSession.update({
      where: { id: sessionId },
      data: { totalFiltered: scored.length },
    });

    // 6. Enrichissement Claude — tags taxonomie + mood + typeContenu + context
    const enrichMap = await enrichVideosBatch(scored);

    // 7. Avatars créateurs (seulement sur les vidéos retenues)
    const channelIds = scored.map(v => v.channelId);
    const avatarMap = await getChannelAvatars(channelIds);

    // 8. Pour chaque vidéo scorée : thumbnail + upsert BDD
    let saved = 0;
    for (const video of scored) {
      try {
        let thumbnailUrl = '';
        let thumbnailStorageKey = null;
        let thumbnailSourceUrl = null;
        try {
          const thumb = await downloadAndStore({
            platform: 'youtube',
            videoId: video.videoId,
          });
          thumbnailUrl = thumb.thumbnailUrl;
          thumbnailStorageKey = thumb.thumbnailStorageKey;
          thumbnailSourceUrl = thumb.thumbnailSourceUrl;
        } catch (err) {
          console.warn(`[ingestion:${sessionId}] Thumbnail failed for ${video.videoId}:`, err.message);
          thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        }

        const channelAvatarUrl = avatarMap[video.channelId] ?? '';
        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const meta = enrichMap[video.videoId] ?? {};

        await prisma.reference.upsert({
          where: { url: videoUrl },
          create: {
            url: videoUrl,
            platform: 'YOUTUBE',
            sourceMode: 'TOPIC_DISCOVERY',
            title: video.title,
            description: video.description ?? '',
            channelName: video.channelName ?? '',
            channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            thumbnailUrl,
            thumbnailSourceUrl,
            thumbnailStorageKey,
            channelAvatarUrl,
            tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
            mood: meta.mood ?? null,
            typeContenu: meta.typeContenu ?? null,
            context: meta.context ?? '',
            status: 'TRIAGE',
            ingestionSessionId: sessionId,
          },
          update: {
            title: video.title,
            description: video.description ?? '',
            channelName: video.channelName ?? '',
            channelAvatarUrl,
            thumbnailUrl,
            thumbnailSourceUrl,
            thumbnailStorageKey,
            tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
            mood: meta.mood ?? null,
            typeContenu: meta.typeContenu ?? null,
            context: meta.context ?? '',
            ingestionSessionId: sessionId,
          },
        });

        saved++;
        await updateSession({ totalSaved: saved });
      } catch (err) {
        console.error(`[ingestion:${sessionId}] Save failed for ${video.videoId}:`, err.message);
      }
    }

    // 8. Session terminée
    await updateSession({
      status: 'COMPLETED',
      completedAt: new Date(),
      totalSaved: saved,
    });

    console.log(`[ingestion:${sessionId}] Completed — ${saved} saved (${scored.length} scored, ${enriched.length} found)`);
  } catch (err) {
    console.error(`[ingestion:${sessionId}] Agent failed:`, err);
    await updateSession({ status: 'FAILED' });
  }
}

// ─── Agent Creator Scan ───────────────────────────────────────────────────────
// Stratégie : playlistItems.list (1 quota unit/call) plutôt que search.list (100 units/call)
// Récupère TOUTES les vidéos des chaînes sélectionnées, sans scoring — l'admin trie ensuite.

export async function runCreatorScanAgent(sessionId, creatorIds) {
  const updateSession = (data) =>
    prisma.ingestionSession.update({ where: { id: sessionId }, data }).catch(console.error);

  try {
    const where = creatorIds?.length
      ? { id: { in: creatorIds }, platform: 'YOUTUBE' }
      : { active: true, platform: 'YOUTUBE' };

    const creators = await prisma.creator.findMany({
      where,
      include: { filterRules: { where: { active: true } } },
    });
    console.log(`[creator-scan:${sessionId}] ${creators.length} creator(s) à scanner`);

    // 1. Pour chaque créateur : résoudre channelId → récupérer tous les videoIds
    const allVideoIds = [];
    const seenVideoIds = new Set();

    for (const creator of creators) {
      let channelId = creator.channelId;

      if (!channelId) {
        // youtubeHandle en priorité (@handle nu ou URL), sinon url legacy
        const identifier = creator.youtubeHandle || creator.url;
        channelId = await resolveChannelId(identifier);
        if (channelId) {
          await prisma.creator.update({ where: { id: creator.id }, data: { channelId } });
          console.log(`[creator-scan:${sessionId}] ${creator.name} → channelId résolu : ${channelId}`);
        } else {
          console.warn(`[creator-scan:${sessionId}] Impossible de résoudre channelId pour ${creator.name} (${identifier})`);
          continue;
        }
      }

      const playlistId = await getUploadsPlaylistId(channelId);
      if (!playlistId) {
        console.warn(`[creator-scan:${sessionId}] Pas de playlist uploads pour ${creator.name}`);
        continue;
      }

      const videoIds = await getAllVideoIdsFromPlaylist(playlistId);
      console.log(`[creator-scan:${sessionId}] ${creator.name} → ${videoIds.length} vidéos`);

      for (const vid of videoIds) {
        if (!seenVideoIds.has(vid)) {
          seenVideoIds.add(vid);
          allVideoIds.push(vid);
        }
      }
    }

    await updateSession({ totalFound: allVideoIds.length });
    console.log(`[creator-scan:${sessionId}] Total unique videoIds : ${allVideoIds.length}`);

    // 2. Enrichissement videos.list par batch de 50
    const allDetails = [];
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batch = allVideoIds.slice(i, i + 50);
      const details = await getVideoDetails(batch);
      allDetails.push(...details);
    }

    // Filtre : garder uniquement les vidéos > 3 minutes
    const aboveDuration = allDetails.filter(v => v.durationSeconds > 180);
    console.log(`[creator-scan:${sessionId}] Après filtre > 3 min : ${aboveDuration.length}/${allDetails.length}`);

    // Filtre : appliquer les FilterRules persistantes par créateur (anti-pollution)
    const channelRulesMap = {};
    for (const creator of creators) {
      if (creator.channelId && creator.filterRules?.length) {
        channelRulesMap[creator.channelId] = creator.filterRules;
      }
    }
    const enriched = aboveDuration.filter(v => {
      const rules = channelRulesMap[v.channelId] ?? [];
      return rules.every(rule => {
        const haystack = rule.type === 'channel_name'
          ? (v.channelName ?? '').toLowerCase()
          : (v.title ?? '').toLowerCase();
        return !haystack.includes(rule.pattern);
      });
    });
    if (aboveDuration.length !== enriched.length) {
      console.log(`[creator-scan:${sessionId}] Après FilterRules : ${enriched.length}/${aboveDuration.length}`);
    }

    // 3. Enrichissement Claude — tags taxonomie + mood + typeContenu + context
    const enrichMap = await enrichVideosBatch(enriched);

    // 4. Avatars créateurs
    const channelIds = enriched.map(v => v.channelId);
    const avatarMap = await getChannelAvatars(channelIds);

    // 5. Thumbnail + upsert BDD
    let saved = 0;
    for (const video of enriched) {
      try {
        let thumbnailUrl = '';
        let thumbnailStorageKey = null;
        let thumbnailSourceUrl = null;
        try {
          const thumb = await downloadAndStore({ platform: 'youtube', videoId: video.videoId });
          thumbnailUrl = thumb.thumbnailUrl;
          thumbnailStorageKey = thumb.thumbnailStorageKey;
          thumbnailSourceUrl = thumb.thumbnailSourceUrl;
        } catch {
          thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        }

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const meta = enrichMap[video.videoId] ?? {};
        await prisma.reference.upsert({
          where: { url: videoUrl },
          create: {
            url: videoUrl,
            platform: 'YOUTUBE',
            sourceMode: 'CREATOR_SCAN',
            title: video.title,
            description: video.description ?? '',
            channelName: video.channelName ?? '',
            channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            thumbnailUrl,
            thumbnailSourceUrl,
            thumbnailStorageKey,
            channelAvatarUrl: avatarMap[video.channelId] ?? '',
            tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
            mood: meta.mood ?? null,
            typeContenu: meta.typeContenu ?? null,
            context: meta.context ?? '',
            status: 'TRIAGE',
            ingestionSessionId: sessionId,
          },
          update: {
            title: video.title,
            description: video.description ?? '',
            channelAvatarUrl: avatarMap[video.channelId] ?? '',
            thumbnailUrl,
            thumbnailSourceUrl,
            thumbnailStorageKey,
            tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
            mood: meta.mood ?? null,
            typeContenu: meta.typeContenu ?? null,
            context: meta.context ?? '',
            ingestionSessionId: sessionId,
          },
        });

        saved++;
        if (saved % 10 === 0) await updateSession({ totalSaved: saved });
      } catch (err) {
        console.error(`[creator-scan:${sessionId}] Save failed for ${video.videoId}:`, err.message);
      }
    }

    await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: saved });
    console.log(`[creator-scan:${sessionId}] Completed — ${saved}/${enriched.length} saved`);
  } catch (err) {
    console.error(`[creator-scan:${sessionId}] Agent failed:`, err);
    await updateSession({ status: 'FAILED' });
  }
}

// ─── Agent Liens manuels ──────────────────────────────────────────────────────
// Reçoit une liste d'URLs YouTube, récupère les métadonnées et sauvegarde en DRAFT.

export async function fetchAndSaveLinks(sessionId, urls) {
  const updateSession = (data) =>
    prisma.ingestionSession.update({ where: { id: sessionId }, data }).catch(console.error);

  try {
    const videoIds = urls.map(extractYouTubeId).filter(Boolean);
    const unique = [...new Set(videoIds)];
    console.log(`[links:${sessionId}] ${unique.length} videoIds valides sur ${urls.length} URLs`);

    await updateSession({ totalFound: unique.length });

    if (!unique.length) {
      await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: 0 });
      return;
    }

    // Enrichissement videos.list
    const enriched = [];
    for (let i = 0; i < unique.length; i += 50) {
      const details = await getVideoDetails(unique.slice(i, i + 50));
      enriched.push(...details);
    }

    // Enrichissement Claude — tags taxonomie + mood + typeContenu + context
    const enrichMap = await enrichVideosBatch(enriched);

    const avatarMap = await getChannelAvatars(enriched.map(v => v.channelId));

    let saved = 0;
    for (const video of enriched) {
      try {
        let thumbnailUrl = '';
        let thumbnailStorageKey = null;
        let thumbnailSourceUrl = null;
        try {
          const thumb = await downloadAndStore({ platform: 'youtube', videoId: video.videoId });
          thumbnailUrl = thumb.thumbnailUrl;
          thumbnailStorageKey = thumb.thumbnailStorageKey;
          thumbnailSourceUrl = thumb.thumbnailSourceUrl;
        } catch {
          thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        }

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const meta = enrichMap[video.videoId] ?? {};
        await prisma.reference.upsert({
          where: { url: videoUrl },
          create: {
            url: videoUrl,
            platform: 'YOUTUBE',
            sourceMode: 'MANUAL',
            title: video.title,
            description: video.description ?? '',
            channelName: video.channelName ?? '',
            channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            thumbnailUrl,
            thumbnailSourceUrl,
            thumbnailStorageKey,
            channelAvatarUrl: avatarMap[video.channelId] ?? '',
            tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
            mood: meta.mood ?? null,
            typeContenu: meta.typeContenu ?? null,
            context: meta.context ?? '',
            status: 'TRIAGE',
            ingestionSessionId: sessionId,
          },
          update: {
            title: video.title,
            description: video.description ?? '',
            channelAvatarUrl: avatarMap[video.channelId] ?? '',
            thumbnailUrl,
            thumbnailSourceUrl,
            thumbnailStorageKey,
            tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
            mood: meta.mood ?? null,
            typeContenu: meta.typeContenu ?? null,
            context: meta.context ?? '',
            ingestionSessionId: sessionId,
          },
        });

        saved++;
        await updateSession({ totalSaved: saved });
      } catch (err) {
        console.error(`[links:${sessionId}] Save failed for ${video.videoId}:`, err.message);
      }
    }

    await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: saved });
    console.log(`[links:${sessionId}] Completed — ${saved}/${enriched.length} saved`);
  } catch (err) {
    console.error(`[links:${sessionId}] Agent failed:`, err);
    await updateSession({ status: 'FAILED' });
  }
}
