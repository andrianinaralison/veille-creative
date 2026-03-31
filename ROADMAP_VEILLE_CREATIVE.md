# 🎯 Roadmap VeilleCreative - Phase 1 (MVP Release 1)
**Statut**: Draft pour Jury PFE  
**Timeline**: 1-2 mois (Mars-Avril 2026)  
**Format**: Now / Next / Later

---

## 📊 État Actuel du Prototype (Mars 31, 2026)

### ✅ COMPLÉTÉ (UI/Routing/Foundation)
- Layout général avec sidebar navigation
- Dashboard héro avec digest featured
- Routing complète pour toutes les pages prévues
- ProjectCreate avec formulaire multi-étapes (Brief → Ambiance → Récap)
- ReferenceCard et ReferenceModal components
- Design system Tailwind (variables couleurs, typographie, spacing)
- Mock data pour prototypage rapide

### ⚠️ EN COURS OU INCOMPLET (Fonctionnalité)
- **DigestPage**: UI existe, manque contenu curé et logique de génération
- **LibraryPage**: Routing OK, manque gestion des références sauvegardées
- **ProjectsPage**: Liste des projets, manque statut et filtres
- **ProjectDetail**: Existence, manque affichage du brief et lien vers moodboard
- **MoodboardBuilder**: Routes OK, manque les 3 layouts de moodboard
- **SurprisesPage**: Routing OK, manque suggestions hors-profil
- **Exploration IA**: Non implémentée (génération de suggestions par brief)
- **Sauvegarde & Contexte**: No persistent storage, pas de tagging
- **Export/Partage**: Non implémenté

### ❌ NON COMMENCÉ
- Backend/API (actuellement mock data)
- Authentification utilisateur
- Base de données (références, projets, bibliothèque utilisateur)
- Agrégation multi-plateformes (Instagram, TikTok, YouTube, etc.)
- Modèle IA de classification des intentions créatives
- Email digest (actuellement UI seulement)
- Analytics/tracking

---

## 🚀 ROADMAP - NOW (Semaines 1-2)

### 1. **Moodboard Builder - 3 Layouts**
**User Story**: US-A3 (Construction de moodboard)  
**Priorité**: CRITIQUE (moment de vérité)  
**Owner**: Frontend  
**Effort**: 1-2 semaines

**Deliverables**:
- [ ] 3 layouts de moodboard prédéfinis
  - Grille serrée (4x3 grid)
  - Planche narrative (1/2/1 vertical flow)
  - Focus colorimétrie (dominant color + palette variations)
- [ ] Drag & drop des références dans le layout
- [ ] Prévisualisation temps réel
- [ ] Component MoodboardLayout réutilisable
- [ ] Tests sur données mockées

**Acceptance Criteria**:
- Temps de génération d'un moodboard complet < 15 min (pour l'utilisateur)
- Drag & drop fonctionnel sur tous les navigateurs
- Transitions visuelles fluides
- Preview mis à jour en temps réel

**Dépendances**: None (données mockées)

---

### 2. **Export Moodboard - PDF + Lien Partageable**
**User Story**: US-A4 (Export et partage client)  
**Priorité**: CRITIQUE (dérivé direct du moodboard)  
**Owner**: Frontend + Backend  
**Effort**: 1 semaine

**Deliverables**:
- [ ] Export one-click en PDF
  - Utiliser ReportLab ou equivalent (PDF génération côté serveur)
  - Préservation du layout et des couleurs
  - Branding VeilleCreative discret (footer)
- [ ] Lien de partage public (accessible sans compte)
  - URL courte `veille.local/share/{id}`
  - Viewer read-only du moodboard
  - Pas de modification possible
- [ ] Intégration au MoodboardBuilder
- [ ] Tests d'accessibilité du PDF

**Acceptance Criteria**:
- PDF généré en < 5 secondes
- PDF propre et prêt à envoyer sans retouche
- Lien partageable fonctionne 48h minimum
- Responsive viewer sur mobile

**Dépendances**: Moodboard Builder

---

### 3. **Digest Page - Content & Layout**
**User Story**: US-B1 (Digest hebdomadaire)  
**Priorité**: TRÈS HAUTE (rétention)  
**Owner**: Frontend + Content  
**Effort**: 1 semaine

**Deliverables**:
- [ ] Layout digest hebdo (15 min lecture max)
  - Hero section (featured trend)
  - 3-4 sections thématiques (Couleur / Format / Narrative / Tendance)
  - Chaque section : 3-5 références visuelles + contexte créatif
- [ ] Sauvegarde one-tap depuis le digest (→ Bibliothèque)
- [ ] CTA "Créer un moodboard" contextuel
- [ ] Affichage durée de lecture estimée
- [ ] Email fallback notice (si non consulté 48h)
- [ ] Mock data du digest (manuel pour MVP)

**Acceptance Criteria**:
- Durée de lecture estimée ≤ 15 min pour 90% des digests
- Navigation fluide entre sections
- Sauvegarde one-tap visible et intuitive
- Design aligne avec Dashboard

**Dépendances**: Design system existant

---

## 📋 ROADMAP - NEXT (Semaines 3-4)

### 4. **Library Page - Référence Sauvegardées + Tagging**
**User Story**: US-B2 (Sauvegarde contextuelle)  
**Priorité**: HAUTE (rétention)  
**Owner**: Frontend + Backend  
**Effort**: 1.5 semaines

**Deliverables**:
- [ ] Affichage des références sauvegardées
  - Grille 4 colonnes (style Dashboard)
  - Ordre : récent d'abord, filtrable
- [ ] Contexte créatif auto-généré (mock)
  - Intention (e.g., "Cinématique", "Couleur douce")
  - Technique utilisée (e.g., "Slow motion", "Color grading chaud")
  - Mood (e.g., "Luxe", "Dramatique")
  - Max 5 tags auto-ajoutés, modifiables
- [ ] Recherche par tags/mots-clés
- [ ] Filtres : par mood, par plateforme, par date
- [ ] Delete/Archive références
- [ ] Share référence individuelle (copier URL)

**Acceptance Criteria**:
- Recherche < 200ms même avec 1000 références
- Tags modifiables inline
- UI responsive sur mobile
- Aucune référence perdue (< 10% perte selon KPI)

**Dépendances**: State management setup (Redux ou Zustand)

---

### 5. **Project Detail + Brief Contexte**
**User Story**: US-A1/A2 (Création + Exploration IA)  
**Priorité**: HAUTE (moment de vérité)  
**Owner**: Frontend  
**Effort**: 1 semaine

**Deliverables**:
- [ ] Affichage du projet créé
  - Titre + Client + Brief (lisible)
  - Mood presets affichés comme badges
  - Deadline en évidence
- [ ] Section "Suggestions IA" (mockées)
  - Affichage de 8-12 références générées "automatiquement"
  - Chacune avec contexte créatif (intention + technique + tags)
  - CTA "Ajouter au moodboard"
- [ ] Lien direct vers MoodboardBuilder
- [ ] Historique du projet (créé le X, moodboard en cours, etc.)

**Acceptance Criteria**:
- Brief visible et lisible
- Suggestions alignées avec le brief (vérif manuelle)
- UX one-click vers moodboard
- Pas de perte de contexte entre pages

**Dépendances**: ProjectCreate (déjà OK)

---

### 6. **Surprises Page - Hors-Profil Recommendations**
**User Story**: US-B3 (Onglet Surprises)  
**Priorité**: MOYENNE (secondaire)  
**Owner**: Frontend  
**Effort**: 0.5 semaine

**Deliverables**:
- [ ] Page Surprises = grille de références "inattenduées"
  - Grille 4 colonnes, style Dashboard
  - Références délibérément hors du profil habituel (mock)
  - Toggle "J'aime" / "Pas pour moi" (stocké localement pour MVP)
- [ ] Lien sauvegarde one-tap
- [ ] CTA vers Digest ou Library

**Acceptance Criteria**:
- Références "surprises" visuellement distinctes
- Sauvegarde fonctionne
- Toggle persiste pendant la session

**Dépendances**: Design system

---

## 🔮 ROADMAP - LATER (Semaines 5-8+)

### 7. **Backend & Data Persistence**
**Priorité**: CRITIQUE (fondation)  
**Owner**: Backend  
**Effort**: 2-3 semaines

**Deliverables**:
- [ ] API REST ou GraphQL
- [ ] Database (PostgreSQL)
  - Schéma : Users, Projects, References, Saves, Tags
- [ ] Authentication (JWT ou sessions)
- [ ] CRUD endpoints pour tous les modèles
- [ ] Rate limiting, error handling

---

### 8. **Agrégation Multi-Plateformes**
**Priorité**: TRÈS HAUTE (core product)  
**Owner**: Backend + Data  
**Effort**: 3-4 semaines

**Deliverables**:
- [ ] Connecteurs pour :
  - Instagram (Graph API)
  - TikTok (Research API)
  - YouTube (Data API)
  - Vimeo (API)
  - Pinterest (API)
- [ ] Scraping/crawling conforme CGU
- [ ] Normalisation des données (thumbnail, métadonnées, source)
- [ ] Job scheduler pour mise à jour quotidienne

---

### 9. **Modèle IA - Classification Intentions Créatives**
**Priorité**: TRÈS HAUTE (differentiation)  
**Owner**: ML/Backend  
**Effort**: 3-4 semaines

**Deliverables**:
- [ ] Dataset d'entraînement : 500-1000 vidéos annotées
  - Intentions : Cinématique, Couleur Douce, Dramatique, Dynamique, etc.
  - Techniques : Slow motion, Color grading, Transitions, etc.
- [ ] Classifier ML (Vision + NLP)
  - Input : vidéo thumbnail + métadonnées
  - Output : [intention, technique, mood, 5 tags]
- [ ] Scoring confiance per prédiction
- [ ] Pipeline d'inférence (< 8 sec par référence)

---

### 10. **Email Digest Automation**
**Priorité**: HAUTE (rétention KPI)  
**Owner**: Backend + DevOps  
**Effort**: 1-2 semaines

**Deliverables**:
- [ ] Cron job générant le digest chaque semaine
- [ ] Email service (Sendgrid, Mailgun)
- [ ] Email template HTML responsive
- [ ] Personalisation par utilisateur (mood presets, etc.)
- [ ] Tracking : open rate, click rate
- [ ] Unsubscribe handling

---

### 11. **Authentification & Onboarding**
**Priorité**: HAUTE (conversion)  
**Owner**: Frontend + Backend  
**Effort**: 1-2 semaines

**Deliverables**:
- [ ] Signup flow
- [ ] Login page
- [ ] Onboarding tour (3-4 steps)
- [ ] First digest trigger (M+1 jour de signup)
- [ ] Premium upgrade prompt (après 10 saves)

---

## 📈 Métriques de Succès (MVP)

| Métrique | Baseline | Cible M6 | Cible M12 |
|----------|----------|----------|-----------|
| **Digest Open Rate (S4)** | N/A | ≥ 55% | ≥ 65% |
| **Moodboard Completion (48h)** | N/A | ≥ 60% | ≥ 75% |
| **References Saved w/ Context** | 60% loss | < 20% loss | < 10% loss |
| **Weekly Veille Time Saved** | 5-6h | ≤ 2h30 | ≤ 1h30 |
| **Activation (Action J1)** | N/A | ≥ 50% | ≥ 65% |
| **NPS** | N/A | ≥ 30 | ≥ 45 |
| **Churn Mensuel** | N/A | ≤ 5% | ≤ 3% |

---

## ⚠️ Risques & Dépendances

### Risques Techniques
| ID | Risque | Probabilité | Impact | Mitigation |
|-----|--------|-------------|--------|-----------|
| R1 | API Instagram/TikTok fermeture | Moyenne | Élevé | Diversifier sources + scraping CGU-conforme |
| R2 | Modèle IA peu pertinent | Moyenne | Élevé | Phase Concierge : curation manuelle d'abord |
| R3 | Performance PDF génération | Basse | Moyen | Queue job + caching |
| R4 | Stockage références volumineuses | Basse | Moyen | S3 + CDN pour thumbnails |

### Dépendances Inter-Tâches
```
MoodboardBuilder
    ↓
Export PDF + Partage
    ↓
Project Detail (Suggestions IA)
    
Digest Page → Library (Sauvegarde)
    ↓
Backend & Data Persistence
    ↓
Agrégation Multi-Plateformes
    ↓
Modèle IA
    ↓
Email Automation
```

---

## 🎬 Prochaines Étapes Immédiates (Semaine 1)

1. **Kick-off technique** : Valider stack backend (Node/Python, DB, hosting)
2. **Design review** : Moodboard Builder avec 3 layouts (Figma)
3. **API design** : Endpoints pour projet, références, moodboard
4. **Setup données mockées** : Étendre mock data pour supporter semaines 2-3
5. **Backlog raffinement** : User stories détaillées pour chaque task
6. **Tests utilisateurs** : Prototype Figma sur moments de vérité (Moodboard + Export)

---

## 📝 Notes

- **MVP Focus**: Parcours A (Projet Client) = plus critique pour validation commerciale (sécurise le devis)
- **Validation**: Après semaine 4, tester sur 5 bêta-testeurs avant d'aller plus loin
- **Hypothèses de risque**: 
  - H1 : Si taux d'ouverture digest < 40% à S4, c'est que le contenu ou le timing est mauvais
  - H2 : Si temps moodboard > 20 min, UX est trop complexe
- **Go/No-go**: Fin semaine 4, décider si on lance version beta publique ou pivot

