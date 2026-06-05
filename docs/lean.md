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

---

## 5C #002 — Polling monitoring 429 (rate-limit ingestion)

**Date** : 2026-06-05
**Détecté par** : Andrianina (console navigateur lors du lancement d'un import)
**Ticket Linear** : 180-33 (Done)

### 1. Constater

Dès le lancement d'un import, la console affiche en boucle `[Monitoring] poll error Error: 429 Too Many Requests`. Le monitoring se bloque, l'utilisateur ne voit pas la progression du scan.

### 2. Contenir (action immédiate)

Modification de `app.js` : `postOnlyLimiter` — le rate-limit ne s'applique qu'aux requêtes `POST`, les `GET` passent directement.

Commit `f74ff5c`.

### 3. Comprendre — 5 Pourquoi

| # | Pourquoi ? | Réponse |
|---|-----------|---------|
| 1 | Pourquoi 429 sur le monitoring ? | `GET /ingestion/sessions/:id` soumis au rate-limit de 10 req/15 min |
| 2 | Pourquoi ce GET est rate-limité ? | `ingestionLimiter` monté sur tout `/api/v1/ingestion/*` sans distinction méthode |
| 3 | Pourquoi sans distinction méthode ? | Le rate-limit a été posé pour protéger les lancements de scan (POST), mais `app.use()` s'applique à toutes les méthodes |
| 4 | Pourquoi non détecté avant ? | Aucun test de polling existant ; le test d'intégration vérifie uniquement le 401, pas le comportement en session réelle |
| 5 | Pourquoi aucun test de polling ? | Le DoD de T-01 (auth) ne couvrait pas les effets de bord sur les routes GET de monitoring |

**Cause racine** : `app.use()` ne filtre pas par méthode HTTP — le rate-limit a été appliqué trop largement sans anticipation du cas polling.

### 4. Corriger (actions permanentes)

| Action | Responsable | Statut |
|--------|------------|--------|
| `postOnlyLimiter` : rate-limit uniquement sur `req.method === 'POST'` | Dev | ✅ Fait |
| Ajouter test : `GET /ingestion/sessions/:id` avec token valide → 200 (pas 429) | Dev | ⬜ À faire (T-02 suite) |

### 5. Consolider

**Enseignement** : quand on ajoute un rate-limit sur un préfixe de routes, vérifier explicitement quelles méthodes (GET/POST/PATCH) sont concernées et lesquelles sont des endpoints de lecture à haut débit (polling, health check, etc.).

**Standard à ajouter dans CLAUDE.md** : tout `rateLimit` sur un préfixe de routes → documenter les méthodes exclues.

---

## 5C #003 — 0 références après scan (ingestionSessionId manquant dans upsert)

**Date** : 2026-06-05
**Détecté par** : Andrianina (front après scan creator — screenshot console)
**Ticket Linear** : 180-34 (Done)

### 1. Constater

Scan complété côté serveur (log : `8/8 saved`), mais le front affiche `ResultsTable` avec "0 références" au lieu de `TriageView` avec les 8 cards.

### 2. Contenir

Ajout de `ingestionSessionId: sessionId` dans les 3 blocs `update` des upserts Prisma (topic discovery, creator scan, liens manuels). Commit `91ec323`.

### 3. Comprendre — 5 Pourquoi

| # | Pourquoi ? | Réponse |
|---|-----------|---------|
| 1 | Pourquoi 0 refs à l'écran ? | `completedSession.references` est vide → condition TRIAGE échoue → ResultsTable vide |
| 2 | Pourquoi `references` vide ? | `include: { references }` filtre par `ingestionSessionId` = session courante, mais les refs upsertées gardaient l'ancien sessionId |
| 3 | Pourquoi ancien sessionId ? | Le bloc `update` de l'upsert ne mettait pas à jour `ingestionSessionId` — seul le bloc `create` le renseignait |
| 4 | Pourquoi oublié dans `update` ? | Lors de l'ajout du statut TRIAGE, le `status: 'TRIAGE'` a été ajouté au `create` mais `ingestionSessionId` dans `update` n'a pas été vérifié |
| 5 | Pourquoi non détecté lors des tests ? | Les tests d'intégration ne couvrent pas le cycle scan complet avec des refs déjà en BDD (scénario N+1) |

**Cause racine** : Absence de test de régression sur le scénario "re-scan d'un créateur déjà scanné".

### 4. Corriger

| Action | Responsable | Statut |
|--------|------------|--------|
| `ingestionSessionId: sessionId` ajouté dans les 3 blocs `update` | Dev | ✅ Fait |
| Test de régression : scan N+1 → les refs apparaissent bien dans la nouvelle session | Dev | ⬜ À ajouter (T-02 suite) |

### 5. Consolider

**Règle** : pour tout upsert Prisma, vérifier que le bloc `update` contient tous les champs qui doivent changer entre deux upserts successifs (notamment les relations `sessionId`).

*Prochaine fiche : 5C #004*
