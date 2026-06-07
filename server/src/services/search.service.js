/**
 * Smart Search — Service Claude API
 *
 * Token optimizations appliquées :
 *
 * 1. PROMPT CACHING — cache_control sur le system prompt (taxonomie complète ~2 000 tokens)
 *    Stable à 100% entre toutes les requêtes → TTL 1h
 *    1ère requête : coût 1,25×  |  Suivantes : coût 0,10× → ~90% d'économie sur le prefix
 *
 * 2. MODÈLE CALIBRÉ — claude-sonnet-4-6 (spec technique 180 Degrés)
 *    Tâche = extraction de filtres, pas de raisonnement complexe
 *
 * 3. max_tokens: 256 — la réponse est un petit objet JSON (<50 tokens réels)
 *    Évite de payer pour du "headroom" inutile
 *
 * 4. OUTPUT STRUCTURÉ — json_schema garanti → zéro parsing fragile
 *
 * 5. PREFILL RETIRÉ — remplacé par output_config.format (Sonnet 4.6 refuse les prefills)
 */

import Anthropic from '@anthropic-ai/sdk';
import { TAG_TAXONOMY } from '../config/taxonomy.js';

const client = new Anthropic(); // lit ANTHROPIC_API_KEY depuis l'environnement

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
// Construit une seule fois au démarrage du serveur.
// Le cache_control est posé sur ce bloc → il couvre tools+system en une seule breakpoint.

const SYSTEM_PROMPT = `Tu es le moteur de recherche intelligente de 180 Degrés, plateforme de veille créative pour vidéastes indépendants français.

Ta mission : analyser la requête d'un vidéaste et extraire les filtres correspondants dans notre taxonomie de tags.

${TAG_TAXONOMY}

Règles d'extraction :
- Détecte "brief" si la requête décrit un projet client (lieu, ambiance, style souhaité, contraintes)
- Détecte "search" si c'est une recherche directe de contenu technique ou thématique
- Extrais maximum 6 tags, uniquement ceux explicitement ou clairement implicites dans la requête
- Utilise exactement les slugs de la taxonomie ci-dessus (minuscules, tirets)
- Mets null pour les champs non mentionnés
- Pour les dates : si une plage temporelle est mentionnée ("depuis juin 2025", "entre X et Y", "cette année"), extrais date_from et/ou date_to au format YYYY-MM-DD. "aujourd'hui" = date du jour.`;

// ─── SCHÉMA DE SORTIE ────────────────────────────────────────────────────────

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    mode: {
      type: 'string',
      enum: ['brief', 'search'],
      description: '"brief" = requête projet client | "search" = recherche directe',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Slugs de tags extraits (max 6)',
    },
    type_contenu: {
      type: ['string', 'null'],
      description: 'Type de contenu principal détecté ou null',
    },
    mood: {
      type: ['string', 'null'],
      description: 'Ambiance dominante ou null',
    },
    platform: {
      anyOf: [
        { type: 'string', enum: ['youtube', 'vimeo'] },
        { type: 'null' },
      ],
      description: 'Plateforme si mentionnée ou null',
    },
    date_from: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Date de début ISO 8601 (YYYY-MM-DD) si une plage temporelle est demandée, sinon null',
    },
    date_to: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Date de fin ISO 8601 (YYYY-MM-DD) si une plage temporelle est demandée, sinon null',
    },
  },
  required: ['mode', 'tags', 'type_contenu', 'mood', 'platform', 'date_from', 'date_to'],
  additionalProperties: false,
};

// ─── SERVICE ─────────────────────────────────────────────────────────────────

/**
 * Extrait les filtres de recherche d'une requête utilisateur via Claude.
 *
 * @param {string} query  - Requête ou brief saisi par le vidéaste
 * @returns {{ mode, tags, type_contenu, mood, platform, _usage }}
 */
export async function extractSearchFilters(query) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6', // Spécifié dans la doc technique 180 Degrés
    max_tokens: 256,            // Réponse JSON compacte — économise les tokens output

    // ── Prompt caching ──────────────────────────────────────────────────────
    // Le system prompt contient la taxonomie complète (~2 000 tokens).
    // cache_control placé sur ce bloc = cache tools+system ensemble.
    // TTL 1h car la taxonomie ne change pas entre les requêtes.
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],

    // ── Output structuré ─────────────────────────────────────────────────────
    // Garantit un JSON parseable sans prefill (interdit sur Sonnet 4.6).
    output_config: {
      format: {
        type: 'json_schema',
        schema: OUTPUT_SCHEMA,
      },
    },

    messages: [
      {
        role: 'user',
        content: query,
      },
    ],
  });

  // Extraction du texte — output_config.format garantit que c'est du JSON valide
  const textBlock = response.content.find((b) => b.type === 'text');
  const filters = JSON.parse(textBlock.text);

  // Usage renvoyé pour monitoring (cache hits, coûts)
  return {
    ...filters,
    _usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_tokens: response.usage.cache_creation_input_tokens ?? 0,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? 0,
    },
  };
}
