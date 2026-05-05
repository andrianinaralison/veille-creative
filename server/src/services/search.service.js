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

const client = new Anthropic(); // lit ANTHROPIC_API_KEY depuis l'environnement

// ─── TAXONOMIE DES TAGS ──────────────────────────────────────────────────────
// Contenu stable (mis à jour max 1x/mois) → candidat idéal au prompt caching.
// Format compact : slugs séparés par virgule pour minimiser les tokens.

const TAG_TAXONOMY = `
## CHIPS artistiques (is_chip=true — affichés dans la modale)

**ambiance** : cinématique, épuré, dramatique, romantique, luxe, intime, mélancolique, nostalgique, épique, mystérieux, joyeux, poétique, élégant, sombre, énergique, rêveur, brut, sensuel, sérieux, authentique

**colorimetrie** : chaud, froid, teal-orange, désaturé, contrasté, pastel, monochrome, film-grain, vintage, moody-dark, natural-light, high-key, low-key, rose-tinted, vert-forêt, sépia

**narration** : émotionnel, rythmé, beat-sync, contemplatif, documentaire, voix-off, non-linéaire, poétique, flashback, jump-cuts, long-takes, slow-burn, punch-cuts, transitions-créatives

**format_image** : 16-9, 2.35-scope, 2.39-ultra-scope, 1.85, open-gate, 4-3, 1-1-carré, 9-16-vertical, 6-5, super8-16mm

## FILTRES panneau (is_filter=true)

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
- Mets null pour les champs non mentionnés`;

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
      type: ['string', 'null'],
      enum: ['youtube', 'vimeo', null],
      description: 'Plateforme si mentionnée ou null',
    },
  },
  required: ['mode', 'tags', 'type_contenu', 'mood', 'platform'],
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
