/**
 * Enrichment Service — passes Claude pour l'ingestion.
 * 3 fonctions : enrichissement tags/mood/context, génération requêtes YouTube, scoring.
 * Aucun accès Prisma ici — pure logique Claude API.
 */

import Anthropic from '@anthropic-ai/sdk';
import { TAG_TAXONOMY } from '../config/taxonomy.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const SCORE_THRESHOLD = 65;

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

export async function enrichVideosBatch(videos) {
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
      system: [{ type: 'text', text: ENRICH_SYSTEM, cache_control: { type: 'ephemeral', ttl: '1h' } }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              enriched: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    videoId:     { type: 'string' },
                    tags:        { type: 'array', items: { type: 'string' } },
                    mood:        { type: ['string', 'null'] },
                    typeContenu: { type: ['string', 'null'] },
                    context:     { type: 'string' },
                  },
                  required: ['videoId', 'tags', 'mood', 'typeContenu', 'context'],
                },
              },
            },
            required: ['enriched'],
          },
        },
      },
      messages: [{ role: 'user', content: `Enrichis ces ${batch.length} vidéos :\n\n${videoList}` }],
    });

    const enriched = JSON.parse(response.content[0]?.text ?? '{}').enriched ?? [];

    for (const entry of enriched) {
      result[entry.videoId] = {
        tags:        Array.isArray(entry.tags) ? entry.tags : [],
        mood:        entry.mood ?? null,
        typeContenu: entry.typeContenu ?? null,
        context:     entry.context ?? '',
      };
    }

    console.log(`[enrich] Batch ${Math.floor(i / BATCH) + 1} — ${enriched.length}/${batch.length} enrichis`);
  }

  return result;
}

export function oneYearAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

export async function generateYouTubeQueries(brief) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [{
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
- minViews: minimum view count as integer. Default to 1000 if not specified.`,
      cache_control: { type: 'ephemeral' },
    }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            queries:        { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 },
            publishedAfter: { type: 'string' },
            minViews:       { type: 'number' },
          },
          required: ['queries', 'publishedAfter', 'minViews'],
        },
      },
    },
    messages: [{ role: 'user', content: brief }],
  });

  const parsed = JSON.parse(response.content[0]?.text ?? '{}');
  return {
    queries:        (parsed.queries ?? []).slice(0, 8),
    publishedAfter: parsed.publishedAfter ?? oneYearAgo(),
    minViews:       typeof parsed.minViews === 'number' ? parsed.minViews : 1000,
  };
}

export async function scoreVideosWithClaude(brief, videos) {
  if (!videos.length) return [];

  const BATCH = 25;
  const kept  = [];

  for (let i = 0; i < videos.length; i += BATCH) {
    const batch     = videos.slice(i, i + BATCH);
    const videoList = batch.map((v, idx) =>
      `[${idx}] id:${v.videoId} | views:${v.viewCount}\nTitle: ${v.title}\nDescription: ${v.description?.slice(0, 200) ?? ''}`
    ).join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              scores: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    videoId: { type: 'string' },
                    score:   { type: 'number', minimum: 0, maximum: 100 },
                    reason:  { type: 'string' },
                  },
                  required: ['videoId', 'score', 'reason'],
                },
              },
            },
            required: ['scores'],
          },
        },
      },
      messages: [{
        role: 'user',
        content: `Original brief:\n"${brief}"\n\nScore each video from 0 to 100.\nHigh score = professional cinematic video matching the brief.\nLow score = tutorials, tips, BTS, unrelated content.\n\nVideos:\n${videoList}`,
      }],
    });

    const scores = JSON.parse(response.content[0]?.text ?? '{}').scores ?? [];

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
