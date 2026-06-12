# Analyse des pages digest de référence
## frameset.app/featured · europeanfilmawards.eu/vimeo · nowness.com/picks

---

## 1. Architecture front — nomenclature Tailwind

### FRAMESET.APP/FEATURED

**Palette** : dark mode intégral — `bg-black text-white`

```
<body class="bg-black text-white min-h-screen">

  <!-- NAV -->
  <header class="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Logo mark (icône grille) -->
      <a class="w-8 h-8 text-white" />

      <!-- Nav centrale : tabs -->
      <nav role="tablist" class="flex gap-8 text-sm font-medium">
        <a class="text-gray-400 hover:text-white transition-colors">Search</a>
        <a class="text-white border-b-2 border-white pb-0.5">Featured</a>   <!-- active -->
        <a class="text-gray-400 hover:text-white transition-colors">Projects</a>
      </nav>

      <!-- Auth / upgrade -->
      <div class="flex items-center gap-3 text-sm">
        <a class="text-gray-300 hover:text-white">Login</a>
        <span class="text-xs text-gray-400">10 searches left</span>
        <button class="bg-indigo-500 text-white text-xs px-3 py-1 rounded-sm font-semibold
                       hover:bg-indigo-400 transition-colors">UPGRADE</button>
      </div>
    </div>
  </header>

  <main class="pt-16">

    <!-- HERO SPOTLIGHT -->
    <section class="relative w-full">
      <p class="text-xs tracking-widest uppercase text-gray-400 text-center pt-16 pb-2">
        Featured Title
      </p>
      <h1 class="text-5xl md:text-7xl font-black text-white text-center leading-tight px-6 pb-8">
        "Blå Ögon" Molly Sanden
      </h1>

      <!-- Thumbnail plein-cadre avec CTA centré -->
      <div class="relative w-full aspect-[16/9] overflow-hidden">
        <img class="w-full h-full object-cover opacity-60" />
        <div class="absolute inset-0 flex items-end justify-center pb-12">
          <button class="inline-flex items-center gap-2 bg-white text-black
                         px-6 py-3 text-sm font-semibold rounded-sm
                         hover:bg-gray-100 transition-colors">
            ▶ Watch the video
          </button>
        </div>
      </div>
    </section>

    <!-- INTRO ÉDITORIALE -->
    <section class="py-16 px-6">
      <p class="max-w-2xl mx-auto text-center text-gray-400 text-sm leading-relaxed">
        The Featured page highlights standout commercials…
      </p>
    </section>

    <!-- FILTRES / TABS -->
    <div class="flex items-center justify-between px-6 border-b border-gray-800 pb-3 mb-8">
      <div role="tablist" class="flex gap-6">
        <button class="text-white font-medium border-b-2 border-white pb-1 text-sm">
          Commentaries
        </button>
        <button class="text-gray-400 hover:text-white text-sm">Titles</button>
      </div>
      <select class="bg-transparent text-gray-400 text-sm border-none outline-none cursor-pointer">
        <option>All categories</option>
      </select>
    </div>

    <!-- GRILLE CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-24">
      <!-- CARD -->
      <a class="group cursor-pointer">
        <div class="relative overflow-hidden">
          <img class="w-full aspect-video object-cover
                      group-hover:opacity-75 transition-opacity duration-300" />
          <!-- Badge "Frameset" watermark top-left sur cards premium -->
          <span class="absolute top-3 left-3 opacity-40">
            <!-- logo SVG miniature -->
          </span>
        </div>
        <div class="mt-3">
          <p class="text-xs text-gray-400">Jack Fitzwilliam on</p>
          <h3 class="text-sm font-semibold text-white mt-0.5 leading-snug">
            A Journey | Tales from the Road
          </h3>
        </div>
      </a>
    </div>

  </main>
</body>
```

---

### EUROPEANFILMAWARDS.EU/VIMEO

**Palette** : nav blanc / sections dark (`bg-[#1a1a1a]`) / accent or (`bg-amber-500`)

```
<body class="bg-white text-gray-900">

  <!-- NAV -->
  <header class="sticky top-0 w-full bg-white border-b border-gray-200 z-50">
    <div class="flex items-center justify-between px-8 py-4">
      <a class="flex items-center gap-3">
        <!-- Logo SVG wireframe + texte -->
        <span class="text-xs font-bold tracking-widest uppercase leading-tight">
          European<br>Film Awards
        </span>
      </a>
      <nav class="flex items-center gap-8">
        <a class="text-sm font-medium text-gray-800 hover:text-amber-500
                  tracking-wide transition-colors">The Awards</a>
        <!-- … -->
        <button class="text-gray-700 hover:text-amber-500">
          <!-- icône search -->
        </button>
      </nav>
    </div>
  </header>

  <!-- HERO CAROUSEL -->
  <section class="relative w-full h-screen bg-[#1a1a1a] overflow-hidden">
    <!-- Slide : image left + panel texte right -->
    <div class="flex h-full">
      <div class="w-1/2 relative overflow-hidden">
        <img class="w-full h-full object-cover opacity-70" />
      </div>
      <div class="w-1/2 flex flex-col justify-center px-16 text-white">
        <h2 class="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Oscar Nominated Shorts
        </h2>
        <p class="text-gray-300 text-base mb-8">
          Get ready for Oscar night with these past nominees.
        </p>
        <hr class="border-amber-500 mb-8" />
        <button class="self-end w-12 h-12 bg-amber-500 flex items-center
                       justify-center text-white text-xl hover:bg-amber-400
                       transition-colors">+</button>
      </div>
    </div>

    <!-- Dots pagination -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
      <span class="w-3 h-3 rounded-full bg-gray-600"></span>
      <span class="w-3 h-3 rounded-full bg-amber-500"></span> <!-- active -->
      <span class="w-3 h-3 rounded-full bg-gray-600"></span>
    </div>
    <!-- Flèches nav -->
    <button class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70
                   hover:text-white text-2xl">←</button>
    <button class="absolute right-4 top-1/2 -translate-y-1/2 text-white/70
                   hover:text-white text-2xl">→</button>
  </section>

  <!-- SECTION STAFF PICKS -->
  <section class="bg-[#1a1a1a] px-8 pt-16 pb-12">

    <!-- Titre display + ligne or -->
    <div class="flex items-baseline gap-4 border-b border-amber-500 pb-4 mb-8">
      <h2 class="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter">
        Staff Picks
      </h2>
      <a class="text-sm text-white underline ml-4 shrink-0">View all</a>
    </div>

    <!-- Search + filtre catégories -->
    <div class="flex flex-col md:flex-row gap-4 mb-10">
      <div class="flex-1 flex items-center gap-3 rounded-full border border-gray-600
                  px-6 py-4 text-white">
        <span class="text-amber-500">🔍</span>
        <input placeholder="Search for Staff Pick titles"
               class="bg-transparent outline-none text-sm text-gray-300 w-full" />
      </div>
      <button class="flex items-center gap-2 rounded-full border border-gray-600
                     px-6 py-4 text-white text-sm hover:border-amber-500 transition">
        Search Categories ▼
      </button>
    </div>

    <!-- Grille 3 colonnes -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- CARD -->
      <article class="group cursor-pointer">
        <div class="relative">
          <img class="w-full aspect-video object-cover" />
          <!-- Badge "Staff Pick" top-right -->
          <div class="absolute top-3 right-3 bg-white/20 backdrop-blur-sm
                      rounded-full px-3 py-1 text-xs text-white font-medium">
            Staff Pick
          </div>
        </div>
        <div class="mt-3 flex items-start gap-3">
          <img class="w-8 h-8 rounded-full object-cover shrink-0" />
          <div>
            <h3 class="text-white font-bold text-base leading-tight">Potato Potato</h3>
            <p class="text-gray-400 text-sm mt-0.5">Josh Locy</p>
          </div>
        </div>
      </article>
    </div>

    <!-- CTA -->
    <div class="text-center mt-12">
      <a class="inline-flex items-center gap-2 text-white text-sm hover:text-amber-500">
        View all →
      </a>
    </div>
  </section>

</body>
```

---

### NOWNESS.COM/PICKS

**Palette** : light editorial — `bg-gray-50 text-gray-900`, full-bleed imagery

```
<body class="bg-gray-50 text-gray-900 min-h-screen">

  <!-- NAV PRINCIPALE -->
  <header class="sticky top-0 bg-white border-b border-gray-100 z-50">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Burger menu -->
      <button class="text-gray-700">☰</button>

      <!-- Logo centré -->
      <a class="text-3xl font-black tracking-[0.25em] text-black uppercase">
        NOWNESS
      </a>

      <!-- Icônes droite -->
      <div class="flex items-center gap-5 text-gray-700">
        <button>🔍</button>
        <button>▶</button>
        <button>👤</button>
      </div>
    </div>

    <!-- Sous-nav -->
    <nav class="flex gap-8 px-6 py-3 text-xs tracking-widest uppercase
                font-medium text-gray-400 border-b border-gray-100">
      <a class="hover:text-black transition-colors">Series</a>
      <a class="hover:text-black transition-colors">Topics</a>
      <a class="text-black border-b-2 border-black pb-0.5">Picks</a>  <!-- active -->
      <a class="hover:text-black transition-colors">Special Programs</a>
    </nav>
  </header>

  <main>

    <!-- PAGE HEADER -->
    <div class="text-center py-10">
      <p class="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1">
        Nowness
      </p>
      <h1 class="text-5xl font-black tracking-widest uppercase text-black">
        PICKS
      </h1>
      <p class="text-sm text-gray-500 mt-2 italic">Premiered by us</p>
    </div>

    <!-- SECTION "PREMIERED BY US" — grille 2 colonnes featured -->
    <section class="grid grid-cols-2 gap-0.5 mb-1">
      <!-- CARD featured -->
      <article class="relative aspect-video overflow-hidden group cursor-pointer">
        <img class="w-full h-full object-cover group-hover:scale-105
                    transition-transform duration-700" />
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80
                    via-black/20 to-transparent"></div>
        <!-- Badge durée -->
        <span class="absolute bottom-3 right-3 bg-black/60 text-white
                     text-xs px-2 py-0.5">02:29</span>
        <!-- Texte sur image -->
        <div class="absolute bottom-0 left-0 p-6 text-white">
          <h2 class="text-2xl font-bold leading-tight">
            Chashitsu Hikari Schürli
          </h2>
          <p class="text-sm text-gray-200 mt-2 line-clamp-2">
            Artist Alexandre de Betak transplants a Japanese ceremonial space…
          </p>
        </div>
      </article>
    </section>

    <!-- SECTION "CURATED BY US" -->
    <section class="max-w-4xl mx-auto px-6 py-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-black uppercase tracking-wide">Curated by us</h2>
        <!-- Sort tabs -->
        <div class="flex gap-4 text-xs tracking-widest uppercase text-gray-400 border-b border-gray-200">
          <button class="text-black border-b-2 border-black pb-1">Most recent</button>
          <button class="hover:text-black transition-colors">Most popular</button>
          <button class="hover:text-black transition-colors">Highest rated</button>
        </div>
      </div>

      <!-- Liste d'articles datés -->
      <article class="flex gap-4 py-4 border-b border-gray-100">
        <span class="text-xs text-gray-400 w-20 shrink-0 pt-1">April 1</span>
        <div class="w-40 aspect-video shrink-0 overflow-hidden">
          <img class="w-full h-full object-cover hover:scale-105 transition-transform" />
        </div>
        <div class="flex-1">
          <span class="text-xs text-gray-400">04:09</span>
          <h3 class="font-bold text-gray-900 mt-0.5 leading-snug">
            Dry Cleaning: Sliced By A Fingernail
          </h3>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">
            BULLYACHE direct and choreograph a surreal short film…
          </p>
          <!-- Actions -->
          <div class="flex gap-4 mt-2 text-xs text-gray-400">
            <button class="hover:text-black">Add to queue</button>
            <a class="hover:text-black">Play ▶</a>
          </div>
        </div>
      </article>

      <!-- Load more -->
      <div class="text-center py-10">
        <button class="text-sm underline text-gray-500 hover:text-black transition-colors">
          Load more
        </button>
      </div>
    </section>

  </main>
</body>
```

---

## 2. Flowchart — parcours utilisateur commun

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARRIVÉE SUR LA PAGE                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  HERO / SPOTLIGHT                                                    │
│  • 1 contenu mis en avant (film, court-métrage, commentaire)        │
│  • Titre large + visuel full-bleed + CTA "Watch / Voir"             │
│  • Courte description éditoriale (intention, curatorial statement)  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FILTRES / NAVIGATION SECONDAIRE                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────────────┐  │
│  │  Tabs (type)  │  │  Catégories   │  │   Sort (récent/popul.) │  │
│  └───────────────┘  └───────────────┘  └────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GRILLE / LISTE DE CONTENUS                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │  CARD    │  │  CARD    │  │  CARD    │  ← 2 ou 3 col.          │
│  │ thumbnail│  │ thumbnail│  │ thumbnail│                          │
│  │ auteur   │  │ auteur   │  │ auteur   │                          │
│  │ titre    │  │ titre    │  │ titre    │                          │
│  └────┬─────┘  └──────────┘  └──────────┘                          │
│       │        (hover → scale / opacity)                            │
└───────┼─────────────────────────────────────────────────────────────┘
        │
        ├── [Clic sur card]
        │         │
        │         ▼
        │   PAGE DÉTAIL CONTENU
        │   • Player vidéo
        │   • Métadonnées (durée, auteur, date)
        │   • Description longue / commentary
        │   • Contenus liés
        │
        └── [Scroll bas de grille]
                  │
                  ▼
           "Load more" / pagination infinie
                  │
                  ▼
           Nouvelles cards chargées
```

**Différences par site :**

| Étape | Frameset | EFA/Vimeo | Nowness |
|---|---|---|---|
| Hero | 1 film spotlight (plein écran) | Carousel multi-collections | Header éditorial léger |
| Filtres | Tabs Commentaries/Titles + dropdown | Search bar + pills catégories | Tabs sort (récent/pop/rated) |
| Layout grille | 3 colonnes | 3 colonnes | 2 col. featured + liste datée |
| Entrée détail | Click → page commentary | Click → player Vimeo embedded | Click → player in-page |
| Pagination | Scroll infini implicite | "Load more" bouton | "Load more" bouton |

---

## 3. Ton & Voice

### FRAMESET — *Practitioner-to-practitioner*

> « Jack Fitzwilliam on A Journey | Tales from the Road »
> « Rigging A Tire Swing for A Slo-Mo Shot »
> « Making 'Crapamatics' To Nail Match Cut Timing »

**Registre :** Technique, direct, humble. C'est un réalisateur qui parle à d'autres réalisateurs. Jamais pontifiant.

**Formule éditoriale :** `[Nom du réalisateur] on [Titre du film]` → le contenu est le **problème résolu**, pas le film en soi.

**Adjectifs dominants :** concret, précis, artisanal. Les titres sonner comme des tutoriels ("Shooting 3000 FPS", "Using a Robot Arm", "Creating a Moveable Ceiling") — ce qui crée une tension productive avec la beauté des visuels.

**Ton global :** éducatif + aspirationnel. Pas de sur-curation. Pas d'élitisme. Transparence sur le processus.

---

### EUROPEAN FILM AWARDS — *Institutionnel-curatorial*

> « Get ready for Oscar night with these past nominees. »
> « Exceptional short films curated by the European Film Academy »
> « Encourage cultural dialogue and showcase layered richness of short films »

**Registre :** Prestige institutionnel. Légitimité académique. Language des festivals.

**Formule éditoriale :** Collection thématique nommée ("SXSW Shorts", "Oscar Nominated Shorts") + sous-titre court et factuel.

**Adjectifs dominants :** "exceptional", "cultural", "layered" — vocabulaire de la reconnaissance artistique formelle.

**Ton global :** Autorité bienveillante. Distance légèrement formelle. Invite à la découverte par le prestige.

---

### NOWNESS — *Literary editorial*

> « Artist Alexandre de Betak transplants a Japanese ceremonial space to a Swiss barn, exploring light, reflection, and memory within rural architecture »
> « Poet Sonny Hall performs an intimate verse, releasing the weight of past memories onto the River Seine »
> « Co-directors ZeHua and YiFan Ge give birth to an unaltered life form, questioning the impact of genetic engineering »

**Registre :** Prose poétique courte. Précision du détail artistique. Chaque description est une micro-critique.

**Formule éditoriale :** `[Sujet/artiste] + verbe fort (transplants, performs, dismantles, casts, animates) + complément évocateur`. Jamais plus d'une phrase ou deux.

**Adjectifs dominants :** "intimate", "brooding", "supernatural", "ephemeral", "surreal". Lexique de l'art contemporain et de la critique cinématographique.

**Ton global :** Premium éditorial. Luxury cultural media. Traite l'image en mouvement comme de l'art.

---

## 4. Design UI

### Palette de couleurs

| | Frameset | EFA/Vimeo | Nowness |
|---|---|---|---|
| Background principal | `#000000` (noir pur) | `#FFFFFF` nav + `#1a1a1a` contenu | `#F5F5F5` (gris très clair) |
| Texte principal | `#FFFFFF` | `#111111` / `#FFFFFF` selon section | `#111111` |
| Accent | `#6366F1` indigo (upgrade) | `#F59E0B` amber/or | Aucun — monochrome pur |
| Texte secondaire | `#9CA3AF` gray-400 | `#9CA3AF` gray-400 | `#6B7280` gray-500 |
| Bordures | `#1F2937` gray-800 | `#E5E7EB` / `#F59E0B` | `#F3F4F6` gray-100 |

### Typographie

| | Frameset | EFA/Vimeo | Nowness |
|---|---|---|---|
| Famille | Sans-serif système (Inter-like) | Sans-serif large (peut-être custom EFA) | Sans-serif haute qualité (tracking élevé) |
| Titre hero | `text-7xl font-black` | `text-5xl font-bold` | `text-5xl font-black tracking-widest uppercase` |
| Titre section | `text-9xl font-black` (Staff Picks EFA) | — | `text-2xl font-black uppercase` |
| Labels/overlines | `text-xs tracking-widest uppercase text-gray-400` | `text-xs uppercase tracking-wide` | `text-xs tracking-widest uppercase` |
| Corps texte | `text-sm leading-relaxed text-gray-400` | `text-base text-gray-300` | `text-sm text-gray-500 line-clamp-2` |

### Composants UI clés

**Navbars :**
- Frameset : plein écran noir, nav centrée, discrète
- EFA : blanc classique, très institutionnel, avec mega-menu
- Nowness : logo centré oversized, iconographie minimaliste, double-nav

**Cards :**
- Frameset : pas de rounding, image brute + texte dessous, pas de border. Très "cinéphile tools".
- EFA : légère shadow, badge overlaid, avatar réalisateur avec texte
- Nowness : zero border/rounded, image plein-cadre avec gradient overlay pour le texte. Mode liste pour "Curated by us" (approche presse/magazine).

**CTAs :**
- Frameset : `bg-white text-black` (inversé) pour "Watch the video" — force le contraste maximum
- EFA : `bg-amber-500` carré (+), boutons pills pour catégories
- Nowness : quasiment aucun CTA visible — "Load more" en texte underline discret, "Play" inline

**Espacement :**
- Frameset : dense, peu de whitespace entre cards (`gap-6`)
- EFA : aéré dans les sections, serré dans la grille
- Nowness : whitespace éditorial généreux dans le header, liste compacte

### Principes visuels partagés

1. **Image first** — les thumbnails sont la star, pas les métadonnées
2. **Typographie display** — chaque site utilise une taille de titre exceptionnellement grande pour les sections-titres (pas juste le H1)
3. **Hiérarchie author → title** — toujours : qui a fait → quoi (jamais l'inverse)
4. **Pas de ratings ni de like counts visibles** — la curation éditoriale remplace le signal social
5. **Dark mode dominant** — 2 sites sur 3 sont dark, le 3e (Nowness) compense par une image ultra-saturée en pleine page
6. **Grille 3 colonnes sur desktop** comme étalon
7. **Durée vidéo toujours affichée** (badge bas-droite), jamais cachée

---

## Synthèse pour votre page Digest

Ce que ces trois pages ont en commun, et que votre Digest devrait intégrer :

- Un **spotlight hero éditorial** : 1 contenu mis en avant avec intention, pas un algorithme
- Une **formule de card identifiable** : auteur + titre court, image dominante
- Un **curatorial statement** court (1–2 phrases max) qui explique pourquoi cette sélection existe
- Une **typographie display forte** pour ancrer la section ("Cette semaine", "À surveiller", etc.)
- **Zéro gamification visible** : pas de compteurs, pas de likes, pas de trending scores
- Un **ton voix-de-connaisseur** : soit technique (Frameset), soit institutionnel (EFA), soit poétique (Nowness) — dans tous les cas, une vraie position éditoriale
