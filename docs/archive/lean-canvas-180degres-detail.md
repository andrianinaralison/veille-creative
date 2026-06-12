# Document d'accompagnement — Lean Canvas 180 Degrés

> Ce document détaille les hypothèses, les choix et les raisonnements derrière chaque bloc du Lean Canvas. Il est destiné à l'usage interne du fondateur et à la préparation des pitchs investisseurs.

---

## Bloc 1 — Problème

### Origine de la validation

Le problème a été identifié par trois sources complémentaires : vécu personnel du fondateur (4 ans de pratique vidéaste indépendant), verbatims de communautés Reddit francophones, et questionnaire auprès d'un réseau de vidéastes.

### Les 3 douleurs classées par impact

**Douleur 1 : le temps perdu.** Les vidéastes consacrent en moyenne 5 à 6 heures par semaine à leur veille, souvent de manière désorganisée. Ce chiffre monte à des pointes lors des phases de réponse à appel d'offres ou post-brief client. C'est la conséquence directe des deux douleurs suivantes.

**Douleur 2 : la pollution algorithmique.** Les plateformes (YouTube, Instagram, TikTok) sont conçues pour maximiser l'engagement, pas pour servir une veille professionnelle. Taper "film de mariage" sur YouTube renvoie un mélange de tutoriels, de vlogs, et de vidéos virales sans qualité technique. La curation n'existe pas : c'est la viralité qui prime.

**Douleur 3 : l'absence d'outil adapté.** Les solutions actuelles sont des détournements d'usages : Notion et Milanote pour organiser des screenshots, Pinterest pour des visuels fixes, Shotdeck et Frameset pour du cinéma haut de gamme. Aucun outil n'est pensé pour les vidéastes de production réelle (mariage, corporate, événementiel).

### Moment de déclenchement

Le besoin atteint son pic lors de la phase de réponse à appel d'offres et post-brief client. Le vidéaste a une deadline implicite : il doit revenir avec une direction créative et des références visuelles pour rassurer son client et justifier son budget. La qualité des références qu'il trouve influence directement son taux de signature.

### L'analogie Vimeo

Vimeo a longtemps joué ce rôle de bibliothèque de qualité pour les vidéastes de production. Son pivot commercial (hébergement payant, focus OTT) a laissé cette communauté orpheline. 180 Degrés s'inscrit dans ce vide.

---

## Bloc 2 — Segments clients

### Persona principale : Léa

Léa a 31 ans, basée à Lyon, micro-entrepreneuse depuis 3 ans, spécialisée dans le mariage haut de gamme et le corporate lifestyle. Chiffre d'affaires de 55 000 euros par an, 12 mariages et 6 projets corporate annuels. Elle travaille sur Sony A7SIII, DaVinci Resolve, partage ses rushs via Frame.io.

Elle n'a pas de processus de veille structuré. Elle alterne entre des sessions de scroll intensif (Instagram, YouTube) qui l'épuisent, et des phases de creux où elle culpabilise de ne pas se tenir informée. Son moment critique est le brief client : elle a besoin de références visuelles précises pour aligner les attentes et justifier un budget.

### Marché cible

44 000 à 50 000 vidéastes indépendants en France en 2022, croissance de 8 à 10 % par an. La cible payante immédiate (freelances établis, CA supérieur à 35 000 euros par an) représente environ 40 % de ce segment, soit 17 000 à 20 000 individus.

SOM réaliste à 36 mois : 1 000 à 1 500 abonnés payants, soit 5 à 8 % du segment établi.

### Stratégie d'entrée par segment

Phase 1 : événementiel (mariage, corporate event recap, festival). Ce segment cumule le plus de projets récurrents, les budgets suffisants pour justifier 19 à 39 euros par mois, et la douleur veille la plus aiguë.

Phase 2 : formats préparés (specs ads, interview corporate, multicaméra, documentaire). La bibliothèque devra avoir atteint 1 200 à 2 000 références pour que la recherche soit pertinente sur ces formats.

### Profils à exclure

Exclus définitivement : amateurs et étudiants débutants (pas de revenus récurrents), YouTubeurs créateurs de contenu (leur veille vise la viralité, pas la qualité technique), motion designers (besoin fondamentalement différent), cinéastes fiction en équipe structurée (Shotdeck répond à leur besoin).

Exclus dans un premier temps : étudiants en école de vidéo (potentiel sur documentaire et specs ads, modèle licence groupe à construire).

---

## Bloc 3 — Proposition de valeur unique

### Tagline retenue

"Arrêtez de chercher. Commencez à vous inspirer."

Cette formule est délibérément binaire. Elle oppose le comportement actuel (la recherche active, épuisante, chronophage) à l'état désiré (l'inspiration qui arrive, curatée, prête à l'emploi). Elle ne décrit pas de features. Elle parle à la douleur.

### Positionnement

"Fait par le métier, pour le métier" est le sous-positionnement central. Il renvoie à la légitimité du fondateur (4 ans de pratique) et à la philosophie produit : c'est la plateforme qui s'adapte aux besoins des vidéastes, pas les vidéastes qui adaptent la plateforme.

Ce positionnement est intentionnellement proche de ce qui a fait Shotdeck (fondé par Lawrence Sher, chef opérateur) et Frameset. La différence est la cible : ces outils visent le cinéma et la publicité haut de gamme. 180 Degrés vise la production réelle francophone, un segment laissé de côté.

### Différenciateur structurel

180 Degrés est le seul outil qui agrège des réalisations vidéo complètes (pas des frames statiques, pas des tutoriels, pas des reels viraux) dans une taxonomie pensée par des vidéastes : type de contenu, mood, technique, caméra, intention créative. La recherche parle leur langue sans traduction.

---

## Bloc 4 — Solution

### La bibliothèque

Seuil de lancement : 1 200 références réelles (300 par type de contenu prioritaire : mariage, corporate event, festival, événementiel généraliste). En dessous, la recherche renvoie trop peu de résultats par requête pour être utile. Au-delà de 300 par type, la valeur perçue augmente exponentiellement.

La bibliothèque est alimentée par l'agent Claude (pipeline d'ingestion : brief textuel vers YouTube Data API vers enrichissement automatique tags et mood vers validation admin). L'ingestion d'un batch de 20 références passe de 3 heures manuelles à 15 minutes avec l'agent.

### Le digest hebdomadaire

10 références par semaine, consultable en 15 minutes. Format validé par un verbatim utilisateur ("un format déjà prêt ça évite de tout chercher moi-même"). La sélection est éditoriale, pas algorithmique.

### La gestion de projets et la restitution client

Feature pivot du MVP : permettre à un vidéaste de sélectionner des références, les organiser par projet, et les partager via un lien propre à son client. Ce n'est pas un moodboard builder complet (drag and drop, mise en page avancée). C'est une vue partageable fonctionnelle. Elle répond directement au JTBD numéro 2 : "La Sécurité Commerciale" (utiliser des références précises pour rassurer un prospect et valider un budget).

---

## Bloc 5 — Canaux

### Phase PoC et MVP (M0 à M9)

La communauté Facebook de filmmakers francophones est le canal de démarrage. Warm audience, retours rapides, validation sociale immédiate. Complété par la stratégie d'abonnements offerts pour créer l'habitude avant de monétiser (modèle Uber : faire découvrir le service gratuitement jusqu'à ce que le besoin soit évident).

Le crowdfunding remplit un double rôle : financement et preuve sociale publique. Un projet crowdfunding réussi est en lui-même un signal de désirabilité marché.

### Phase GTM (M9 à M18)

Les influenceurs francophones sont le canal d'acquisition principal. Dans la niche vidéaste, le bouche à oreille est le mécanisme dominant (comme Lightshare, DaVinci Resolve, Frame.io : les outils deviennent des standards par adoption communautaire, pas par publicité). Un placement chez Mr Camera ou Derrière La Caméra peut générer plusieurs centaines d'inscriptions en quelques jours.

Le partenariat avec une boîte de location de matériel audiovisuel parisienne est un canal de distribution indirect pertinent : ils s'adressent à la cible exacte au moment où elle investit dans son métier.

### SEO long terme

Mots-clés à fort intent : "outils vidéaste freelance", "tendances vidéo mariage 2026", "idées références corporate video", "inspiration film événementiel". Contenu éditorial autour des tendances visuelles par type de projet.

---

## Bloc 6 — Revenus

### Logique de paliers

Le modèle freemium fonctionne si la friction tombe exactement au bon moment : quand l'utilisateur ressent le plus de valeur, pas avant (il part), pas après (il n'upgrade pas).

Pour 180 Degrés, les moments naturels d'upsell sont la 11ème référence sauvegardée, la création d'une restitution client à partager, l'accès au digest complet, et les filtres avancés (caméra, technique, mood).

### Pricing

Discovery gratuit : lead magnet, création de l'habitude, qualification des prospects.
Solo 19 euros par mois : cible principale, vidéaste freelance établi.
Pro 39 euros par mois : vidéaste avec projets clients fréquents, besoin de restitution client soignée.
Agency 89 euros par mois (V2) : micro-agence, multi-utilisateurs.
Engagement annuel : 1 mois offert (équivalent à 8 % de remise, améliore la rétention et la visibilité cashflow).

### Unités économiques recalibrées (benchmarks SaaS 2025-2026)

ARPU moyen : 23 à 25 euros en phase initiale (majorité Solo, remises early adopters), montant vers 27 euros à maturité.
Churn mensuel : 5 à 6 % au départ (freelances volatils), cible 3,5 à 4 % à maturité.
Conversion freemium vers payant : 4 à 5 % en base case, 7 à 8 % en scénario ambitieux.
LTV base case : 600 à 800 euros. LTV cible : 1 000 à 1 200 euros.
CAC réaliste : 150 à 250 euros (incluant temps fondateur, contenus, remises).
Ratio LTV sur CAC : 3:1 à 5:1 (zone saine pour un SMB SaaS, médiane sectorielle à 3,2:1).

---

## Bloc 7 — Structure de coûts

### Par phase

Phase PoC (M0 à M3) : 150 euros cash. Infra sur tiers gratuits, Anthropic API en mode dev.

Phase MVP (M3 à M9) : 1 900 à 2 200 euros. Première infra payante, audit RGPD one-shot.

Phase GTM (M9 à M18) : 1 500 à 1 800 euros par mois. Curateur éditorial freelance (500 euros), marketing influenceurs (500 euros), dev DevOps part-time (200 euros), infra et API (300 euros). Prévoir 15 à 20 % de buffer sur l'ensemble.

Phase Scale (M18 à M36) : 8 500 à 9 700 euros par mois. Inclut la rémunération Andri partielle (2 500 euros), dev full-stack, curateur éditorial, growth et community manager.

### Break-even

350 à 400 abonnés payants, atteint entre M23 et M25 selon le mix tarifaire réel et les remises accordées en phase early adopter.

---

## Bloc 8 — Métriques clés

### Structure par phase

Les métriques évoluent avec la maturité du produit.

En phase PoC et MVP, la question centrale est : est-ce que les gens veulent payer ? La NSM Business est le taux de conversion freemium vers premium, complété par le NPS à 30 jours.

En phase GTM et Scale 1, la question centrale est : est-ce que le produit est efficace ? La NSM Produit est le temps moyen pour finaliser un dossier client (proxy de valeur UX, mesure si la plateforme tient sa promesse de gain de temps).

En phase Scale 2, la question centrale est : est-ce que les gens restent ? Le churn mensuel devient la métrique pilote.

### Métriques de levée pre-seed (M32 à M36)

MRR supérieur à 22 000 euros, churn inférieur à 3,5 %, NPS supérieur à 40, LTV sur CAC observable entre 4:1 et 5:1. Ces niveaux sont défendables pour un ticket pre-seed de 500 000 à 1 500 000 euros sur un marché de niche clairement identifié.

### Ce qu'on mesurera dès M9

Churn réel par cohorte (mois 1, 3, 6), conversion freemium vers payant par canal d'acquisition, ARPU réel par segment, NPS à 30 jours. Ces données permettront de passer des hypothèses aux unit economics observables, indispensables pour le narratif investisseur.

---

## Bloc 9 — Avantage injuste

### Ce qui existe aujourd'hui

La légitimité fondateur est le seul avantage structurel immédiat. Andri a tourné pendant 4 ans, connaît le workflow de l'événementiel, le langage des vidéastes, ce qu'ils cherchent vraiment avant un projet. Cette connaissance de l'intérieur génère une taxonomie que personne d'autre ne peut construire en quelques mois : les bons mots pour les filtres, les bons angles éditoriaux, les bons critères de sélection.

### Ce qui se construit dans le temps

Le catalogue UGC est le moat le plus puissant à terme. Si les vidéastes postent leurs propres réalisations sur 180 Degrés, la plateforme développe une bibliothèque exclusive qu'aucun concurrent ne peut racheter. C'est du temps et de la confiance accumulée, pas du capital.

Les données comportementales sont le deuxième actif propriétaire : ce que les vidéastes français cherchent réellement, quelles requêtes aboutissent à des sauvegardes, quelles références sont utilisées dans des projets signés. Un an de comportement utilisateur réel est impossible à répliquer.

Le switching cost produit apparaît à partir de 3 à 6 mois d'usage actif : projets organisés, références sauvegardées, dossiers clients créés. Un utilisateur qui a structuré son flux de travail sur 180 Degrés ne repart pas de zéro pour un concurrent.

### Regard honnête sur la fragilité

Aujourd'hui, un concurrent bien financé pourrait recruter un vidéaste crédible, acheter une audience influenceur, et construire un produit similaire en 8 mois. Il n'y a pas encore de moat structurel infranchissable.

L'avantage défensif réel se construit par l'exécution rapide : être dans les mains des utilisateurs avant que le concurrent existe, créer l'habitude, accumuler le catalogue, intégrer le produit dans le workflow. Le lead-time est la ressource rare, pas la technologie.

---

## Hypothèses à valider en priorité

Par ordre d'impact sur la viabilité du modèle :

1. La conversion freemium vers payant réelle (hypothèse : 4 à 5 %, à mesurer dès M7)
2. Le churn à 90 jours sur les premières cohortes (hypothèse : 5 à 6 %, à observer dès M9)
3. L'ARPU réel par segment (impact direct sur le break-even)
4. Le taux d'approbation des références générées par l'agent Claude (cible : supérieur à 70 %, mesurable dès les premières sessions d'ingestion)
5. Le temps réel pour finaliser un dossier client sur la plateforme (NSM Produit, à mesurer en phase beta)

---

*Document généré le 2026-05-31. À réviser après chaque fin de phase avec les données réelles.*
