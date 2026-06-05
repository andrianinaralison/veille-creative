# Lean — Dysfonctionnements Way of Working

> Ce fichier trace tous les problèmes détectés en environnement (front, back, process) avec leur analyse causale 5C.
> **Règle** : dès qu'un utilisateur ou un membre de l'équipe détecte un dysfonctionnement, on convoque l'équipe produit et on ouvre une fiche 5C ici.
> **Format** : une fiche par incident, numérotée, datée, avec le ticket Linear associé.

---

## 5C #001 — Page `/admin/references` vide après refacto auth

**Date** : 2026-06-05
**Détecté par** : Andrianina (utilisateur, navigation front)
**Ticket Linear** : créé post-correctif (BUG — fetch brut non migré après refacto auth)
**Ticket source** : 180-8 (T-01 — sécuriser routes admin & ingestion)

---

### 1. Constater

**Symptôme observé** : La page `/admin/references` ne chargeait plus aucune référence après la mise en prod de T-01. Aucun message d'erreur visible — liste simplement vide.

**Environnement** : Front local (Vite dev server), backend redémarré avec les nouvelles variables d'env.

**Moment de détection** : Après clôture et marquage Done du ticket 180-8.

---

### 2. Contenir (action immédiate)

- Identification du `fetch` brut ligne 555 de `ReferencesAdminPage.jsx` utilisant `API` (renommé `API_PATH`)
- Remplacement par `apiFetch('/references?...')` — commit `7a6586d`
- Audit étendu → `localhost` hardcodé dans `AdminLogin.jsx` — commit `b867c12`
- Règle ajoutée dans `CLAUDE.md` — commit `5537624`

---

### 3. Comprendre — 5 Pourquoi

| # | Pourquoi ? | Réponse |
|---|-----------|---------|
| 1 | Pourquoi la page était vide ? | `fetch(\`${API}/references?...\`)` — `API` était `undefined` après renommage |
| 2 | Pourquoi `API` était `undefined` ? | La variable avait été renommée `API_PATH` lors de la refacto mais pas tous les usages mis à jour |
| 3 | Pourquoi cet usage a-t-il échappé ? | Le `fetch` ligne 555 était un appel direct (non encapsulé dans `apiFetch()`), invisible au grep basique sur `fetch(` |
| 4 | Pourquoi aucun test n'a-t-il détecté ça ? | Le DoD du ticket 180-8 n'incluait pas de vérification UI post-refacto ; aucun test automatisé (T-02 non encore fait) |
| 5 | Pourquoi le DoD ne l'incluait pas ? | Le WAY-OF-WORKING ne formalisait pas l'obligation de tester chaque page affectée dans le navigateur avant clôture d'une refacto |

**Cause racine** : Absence de critère de test UI dans le DoD des tickets de refacto, combinée à l'absence de tests automatisés (T-02 en attente).

---

### 4. Corriger (actions permanentes)

| Action | Responsable | Statut |
|--------|------------|--------|
| Règle "tests obligatoires avant clôture" dans `CLAUDE.md` | Dev | ✅ Fait |
| Grep systématique sur anciens identifiants après toute refacto | Dev | ✅ Intégré dans règle |
| Ajouter critère UI dans le DoD standard du WAY-OF-WORKING | PM / Tech Lead | ⬜ À faire |
| T-02 Vitest : tests d'intégration 401 sur routes admin | Dev | ⬜ En attente (180-9) |

---

### 5. Consolider (prévenir la récurrence)

**Décision process** : Dès qu'un bug est détecté par un utilisateur en environnement :
1. Ouvrir une fiche 5C dans ce fichier (même si le fix est trivial)
2. Créer un ticket Linear marqué `type/bug`, l'assigner au dev responsable, le mettre dans le cycle courant
3. Mettre à jour le WAY-OF-WORKING si la cause racine révèle une lacune de process
4. Convoquer l'équipe produit si l'impact dépasse un seul composant

**Mise à jour WAY-OF-WORKING requise** : Ajouter dans la section DoD — "toute refacto d'imports ou de helpers : grep sur anciens identifiants + test navigateur de chaque page affectée avant clôture".

---

*Prochaine fiche : 5C #002*
