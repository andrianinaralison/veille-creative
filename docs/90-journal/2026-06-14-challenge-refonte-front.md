# Thread équipe produit — challenge refonte front « Explorer / Bibliothèque »

> **Statut** : 📸 Instantané daté · **Date** : 2026-06-14 · Équipe : Sophie (PM), Alex (Tech Lead), Léo (Backend), Thomas (Frontend), Marie (Design), Camille (Research), Jordan (Product Ops), Antoine (HOE)
> Résultat : PRD [`refonte-front-explorer.md`](../10-produit/prd/refonte-front-explorer.md) + 23 tickets (180-64→86) + 4 projets Linear.

## Les 7 tensions soulevées

1. **Bibliothèque vide pour un outil pro (Camille vs analogie Spotify)** — Léa entre avec une deadline, pas pour consommer. Conclusion : la valeur immédiate est dans **Explorer**, pas dans Bibliothèque ; l'**onboarding** devient le pont obligatoire et peut pré-seeder la reco. ⚠️ Mismatch (Alex) : l'onboarding collecte des *secteurs*, la reco tourne sur la *taxonomy* → il faut un mapping, sinon le cold-start ne s'amorce pas.

2. **Le moteur de sections auto est un produit en soi (Léo/Alex/Antoine)** — triggers + snapshot + override = CMS + ordonnanceur (BullMQ/Redis). Arbitrage Antoine : **v1 figée** (requête calculée à la lecture + cache, pas de cron), moteur configurable en v0.10.

3. **Trendy « vues » ≠ « saves » (Camille)** — Andri a basculé Trendy de "plus sauvegardé" à "plus vu". C'est la résolution du chicken-egg beta : **vues YouTube = proxy qui marche jour 1**, bascule vers le signal save quand volume (v0.10).

4. **Tout dépend de la qualité des tags (Alex/Camille)** — reco, similaires, sections-par-tag, mapping onboarding s'effondrent sans taxonomie dense. Mesure Camille : **97% des refs publiées ont 0 tag**. → track « refonte tags + enrichissement » sur le chemin critique de v0.9.

5. **La modale = composant le plus important (Marie/Thomas)** — lecture + infos + prix + save + add-projet + similaires + lien créateur, présent partout. À designer **une fois** ; `ReferenceCard` + `ReferenceModal` uniques, chaque page = une disposition.

6. **NL en bibliothèque : coût vs valeur (Léo/Jordan)** — sur 20-50 refs, un filtre texte suffit. NL en bibliothèque **reporté v0.10** ; NL reste central dans Explorer.

7. **Données créateur auto-créées (Léo/Camille)** — dédoublonner sur `channelId` (pas le nom), tracer les plateformes scrappées. Mesure : seulement **18 créateurs** → migration petite. Ticket data dédié.

## Décisions actées (forks tranchés par Andri)

1. Découpage : **3 vagues + Track 0** (Track 0 → v0.8 → refonte tags → v0.9 → v0.10).
2. Sections auto : **v1 figée** (calcul à la lecture + cache, override persistant).
3. Backlog v0.6.1 : **absorber** 180-58/60/63, **maintenir** 180-59/61/62 (sécu/RGPD).

## Finding data majeur

97% des refs publiées sans taxonomie (mesuré le 2026-06-14). Valide empiriquement que v0.8 doit être indépendant des tags, et que la reco (v0.9) a un prérequis dur d'enrichissement.
