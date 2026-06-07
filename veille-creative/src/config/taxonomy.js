/**
 * Taxonomie 180 Degrés — miroir structuré de server/src/config/taxonomy.js
 * À mettre à jour manuellement si la taxonomie backend change.
 * Ne pas importer depuis le backend (pas de partage cross-process).
 */

export const TAXONOMY_AXES = [
  {
    id: 'ambiance',
    label: 'Ambiance',
    tags: [
      'cinématique','épuré','dramatique','romantique','luxe','intime',
      'mélancolique','nostalgique','épique','mystérieux','joyeux','poétique',
      'élégant','sombre','énergique','rêveur','brut','sensuel','sérieux','authentique',
    ],
  },
  {
    id: 'colorimetrie',
    label: 'Colorimétrie',
    tags: [
      'chaud','froid','teal-orange','désaturé','contrasté','pastel',
      'monochrome','film-grain','vintage','moody-dark','natural-light',
      'high-key','low-key','rose-tinted','vert-forêt','sépia',
    ],
  },
  {
    id: 'narration',
    label: 'Narration',
    tags: [
      'émotionnel','rythmé','beat-sync','contemplatif','documentaire','voix-off',
      'non-linéaire','poétique','flashback','jump-cuts','long-takes',
      'slow-burn','punch-cuts','transitions-créatives',
    ],
  },
  {
    id: 'format_image',
    label: 'Format image',
    tags: [
      '16-9','2.35-scope','2.39-ultra-scope','1.85','open-gate',
      '4-3','1-1-carré','9-16-vertical','6-5','super8-16mm',
    ],
  },
  {
    id: 'type_contenu',
    label: 'Type de contenu',
    tags: [
      'mariage','corporate','événementiel','publicité-ads','documentaire',
      'court-métrage','clip-musical','portrait','fashion-lifestyle',
      'sport-action','gastronomie','immobilier','travel-voyage','nature','engagement-couple',
    ],
  },
  {
    id: 'camera',
    label: 'Caméra',
    tags: [
      'sony-fx3','sony-fx6','sony-fx9','sony-a7siii','sony-a1','sony-zve1',
      'canon-c70','canon-c300iii','canon-r5c',
      'bmpcc4k','bmpcc6k','bm-ursa',
      'lumix-s5ii','lumix-s1h',
      'red-komodo','red-monstro','arri-alexa',
      'dji-ronin4d','iphone-smartphone','gopro-action',
    ],
  },
  {
    id: 'optique',
    label: 'Optique',
    tags: [
      'anamorphique','sphérique','prime','zoom','macro','grand-angle',
      'téléobjectif','vintage-dezoomé','tilt-shift','fisheye',
    ],
  },
  {
    id: 'technique_tournage',
    label: 'Technique',
    tags: [
      'handheld','gimbal-stabilisé','trépied','drone-aérien','fpv',
      'steadicam','slider','jib-grue','sous-marin','caméra-embarquée',
      'macro','timelapse','hyperlapse','slow-motion','double-exposition','tilt-shift','360',
    ],
  },
  {
    id: 'mouvement_camera',
    label: 'Mouvement caméra',
    tags: [
      'statique','panoramique','travelling-avant','travelling-arrière','travelling-latéral',
      'push-in','pull-out','rotation','plongée','contre-plongée',
      'dutch-angle','low-angle','high-angle','crane-up','crane-down',
      'zoom-optique','dézoom',
    ],
  },
  {
    id: 'cadrage',
    label: 'Cadrage',
    tags: [
      'plan-large','plan-ensemble','plan-moyen','plan-américain','plan-rapproché',
      'gros-plan','insert-détail','pov-subjectif','over-the-shoulder','two-shot',
      'birds-eye','worms-eye','symétrique','règle-des-tiers','cadre-dans-cadre',
      'leading-lines','silhouette',
    ],
  },
  {
    id: 'eclairage',
    label: 'Éclairage',
    tags: [
      'natural-light','golden-hour','blue-hour','midi-lumière-dure','nuit-low-light',
      'contre-jour','backlight','studio','softbox','lumière-dure','fenêtre',
      'feu-flamme','néon-led-coloré','high-key','low-key','practicals',
      'haze-fumée','silhouette','sous-exposé-intentionnel',
    ],
  },
  {
    id: 'lieu',
    label: 'Lieu',
    tags: [
      'intérieur','extérieur','urbain','campagne','montagne','mer-plage',
      'forêt','désert','château-domaine','loft-industriel','église',
      'salle-réception','rooftop','studio','destination-international','jardin','sous-marin',
    ],
  },
  {
    id: 'saison_meteo',
    label: 'Saison / météo',
    tags: [
      'été','automne','hiver','printemps','soleil','nuageux','pluie','neige','brouillard','crépuscule',
    ],
  },
  {
    id: 'post_production',
    label: 'Post-prod',
    tags: [
      'film-grain','light-leaks-flares','transitions-morphing','split-screen',
      'texte-titrage','vfx-léger','color-grading-prononcé','lut-cinéma',
      'letterbox-animé','glitch','double-exposition','slow-ramp',
    ],
  },
  {
    id: 'nb_sujets',
    label: 'Nombre de sujets',
    tags: ['solo','duo','groupe-moins-10','groupe-plus-10','foule','sans-sujet-humain'],
  },
  {
    id: 'niveau_production',
    label: 'Niveau de production',
    tags: ['solo-one-man-band','petite-équipe-2-3','équipe-complète','production-cinéma'],
  },
]

export const ALL_VALID_TAGS = TAXONOMY_AXES.flatMap(a => a.tags)
