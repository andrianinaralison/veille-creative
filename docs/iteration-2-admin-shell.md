# Itération 2 — Shell Admin

## CONTEXTE

**Verrouillé (ne pas toucher) :**
- `LibraryPage.jsx`, `ReferenceCard.jsx`, `ReferenceModal.jsx`, `mockData.js`
- Design system dark cinema — tokens Tailwind `bg-canvas`, `text-ink`, `font-editorial`, `font-mono`
- `server/src/routes/search.route.js` et `search.service.js`
- `server/src/lib/supabase.js` et `thumbnail.service.js`
- Schéma Prisma (itération 1 validée)

**Ce que cette itération ajoute :**
- Backend : routes `/api/v1/admin/*` (GET /references + PATCH /:id/status)
- Frontend : `AdminLayout.jsx` + `CurationPage.jsx` + `ReferencesAdminPage.jsx`
- `App.jsx` branché sur `/admin/*`

---

## TÂCHE

1. **Backend** — `server/src/routes/admin.route.js` monté dans `index.js`
2. **Frontend** — shell admin React avec layout propre et navigation distincte

---

## GUIDELINES

### Backend

`GET /api/v1/admin/references`
- Params query : `status` (optionnel), `limit` (défaut 50), `offset` (défaut 0)
- Retourne : `{ references: [...], total: number }`
- Ordre : `createdAt DESC`

`PATCH /api/v1/admin/references/:id/status`
- Body : `{ status: 'PUBLISHED' | 'REJECTED' | 'DRAFT' }`
- Si `PUBLISHED`, pose `publishedAt: new Date()`
- 400 si statut invalide, 404 si id inconnu

### Frontend

**AdminLayout**
- Topbar fixe `h-12` (vs `h-14` du Layout public) — distinct mais cohérent
- Logo 180Degré cliquable → `/` (retour front)
- Badge `Admin` en `font-mono uppercase`
- NavLinks : Curation / Références — underline actif identique à Layout
- Lien `← Plateforme` en haut à droite → `/library`
- Pas de `<Layout>` imbriqué — AdminLayout utilise `<Outlet />`

**CurationPage (`/admin/curation`)**
- Shell placeholder pour itération 3
- Titre éditorial + description du mode Topic Discovery
- Zone formulaire désactivée (opacity-30) avec texte "itération 3"

**ReferencesAdminPage (`/admin/references`)**
- Fetche `GET /api/v1/admin/references` au montage
- Filtre par statut (boutons pill — Tous / Draft / Publié / Rejeté)
- Liste dense : thumbnail + titre + channelName + tags (3 max) + statut
- États : loading, error, empty, résultats
- Boutons "Publier" / "Rejeter" présents mais désactivés (opacity-30) — itération 4

---

## CONTRAINTES

- ESM partout — pas de `require()`
- `Navigate` de react-router-dom pour le redirect `/admin` → `/admin/curation`
- Aucun arrondi sauf les futures pills de statut
- Pas d'import de `Layout.jsx` dans les fichiers admin

---

## PROMPT DE VALIDATION

```bash
# 1. Lancer le backend
cd server && node src/index.js

# 2. Tester les routes (dans un autre terminal)
curl http://localhost:3001/api/v1/admin/references
# → { references: [], total: 0 }

curl -X PATCH http://localhost:3001/api/v1/admin/references/nonexistant/status \
  -H "Content-Type: application/json" \
  -d '{"status":"PUBLISHED"}'
# → 404 { error: "Référence introuvable" }

curl -X PATCH http://localhost:3001/api/v1/admin/references/nonexistant/status \
  -H "Content-Type: application/json" \
  -d '{"status":"INVALID"}'
# → 400 { error: "Statut invalide..." }

# 3. Lancer le frontend
cd veille-creative && npm run dev

# 4. Naviguer vers http://localhost:5173/admin
# → Redirect automatique vers /admin/curation ✅
# → AdminLayout visible (topbar distinct, badge "Admin") ✅
# → /admin/references charge sans erreur JS ✅
# → Filtre statut fonctionnel ✅
# → Liste vide affichée proprement ✅
```

---

## CORRECTIFS POST-GÉNÉRATION

— À venir

---

## Fichiers produits

| Fichier | Rôle |
|---|---|
| `server/src/routes/admin.route.js` | Routes admin Express |
| `server/src/index.js` | +import adminRoute |
| `veille-creative/src/pages/admin/AdminLayout.jsx` | Layout admin distinct |
| `veille-creative/src/pages/admin/CurationPage.jsx` | /admin/curation (placeholder) |
| `veille-creative/src/pages/admin/ReferencesAdminPage.jsx` | /admin/references (liste réelle) |
| `veille-creative/src/App.jsx` | +routes admin imbriquées |
