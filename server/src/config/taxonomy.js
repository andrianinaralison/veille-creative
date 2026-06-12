/**
 * Taxonomie 180 Degrés — source unique.
 * Importée par search.service.js et ingestion.service.js.
 * Toute modification ici se propage aux deux services automatiquement
 * et préserve le prompt caching Claude (même contenu = même cache key).
 */

export const TAG_TAXONOMY = `
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

// Axes structurés dérivés du prompt — garantit que la liste des slugs valides
// est exactement celle que Claude voit (180-49 : séparation tags YT / taxonomy).
const AXIS_LINE = /^\*\*([a-z_]+)\*\* : (.+)$/;

export const TAXONOMY_AXES = TAG_TAXONOMY
  .split('\n')
  .map(line => line.trim().match(AXIS_LINE))
  .filter(Boolean)
  .map(m => ({ id: m[1], tags: m[2].split(',').map(t => t.trim()) }));

export const ALL_VALID_TAGS = new Set(TAXONOMY_AXES.flatMap(a => a.tags));
