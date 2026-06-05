# Itération 1 — Prisma schema + migration Supabase

<!--
## BACKLOG — Historique des prompts et correctifs

### Statut
⏳ À faire

### Décisions techniques
- Supabase PostgreSQL comme base de données cible (projet 180Degre déjà provisionné)
- Prisma ORM avec `DATABASE_URL` pointant vers Supabase
- Migration via `prisma migrate dev` (crée les tables dans Supabase)
- Seed depuis les mock data existantes (60+ références dans mockData.js)
-->

---

## CONTEXTE

Le frontend React tourne avec 60+ références mockées dans `veille-creative/src/data/mockData.js`.
Le backend Express existe avec le smart search (`POST /api/v1/search`) mais retourne `results: []` — aucune vraie BDD.
Supabase Storage est configuré et opérationnel (bucket `thumbnails`).

Cette itération crée le schéma Prisma, génère la migration dans Supabase, et insère les données mock en base. Aucun endpoint ne change de comportement visible — c'est la fondation pour tout le reste.

---

## TÂCHE

1. Écrire `server/prisma/schema.prisma` avec les 3 modèles principaux
2. Configurer la connexion Supabase dans `server/.env`
3. Exécuter `prisma migrate dev` pour créer les tables
4. Écrire et exécuter un seed depuis `mockData.js`

---

## GUIDELINES

### Schéma Prisma

**Model `Reference`**
```prisma
model Reference {
  id                  String    @id @default(cuid())
  url                 String    @unique
  platform            Platform
  sourceMode          SourceMode @default(MANUAL)
  title               String
  description         String    @db.Text
  channelName         String
  channelUrl          String
  thumbnailUrl        String
  thumbnailSourceUrl  String?
  thumbnailStorageKey String?
  tags                String[]
  mood                String?
  typeContenu         String?
  context             String    @db.Text @default("")
  status              RefStatus @default(DRAFT)
  ingestionSessionId  String?
  createdAt           DateTime  @default(now())
  publishedAt         DateTime?

  ingestionSession    IngestionSession? @relation(fields: [ingestionSessionId], references: [id])
}
```

**Model `IngestionSession`**
```prisma
model IngestionSession {
  id          String          @id @default(cuid())
  mode        SourceMode
  status      SessionStatus   @default(RUNNING)
  brief       String          @db.Text @default("")
  totalFound  Int             @default(0)
  totalSaved  Int             @default(0)
  createdAt   DateTime        @default(now())
  completedAt DateTime?

  references  Reference[]
}
```

**Model `Creator`**
```prisma
model Creator {
  id          String    @id @default(cuid())
  name        String
  url         String    @unique
  platform    Platform
  channelId   String?
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
}
```

**Enums**
```prisma
enum Platform {
  YOUTUBE
  VIMEO
  WEB
}

enum SourceMode {
  TOPIC_DISCOVERY
  CREATOR_SCAN
  MANUAL
}

enum RefStatus {
  DRAFT
  PUBLISHED
  REJECTED
}

enum SessionStatus {
  RUNNING
  COMPLETED
  FAILED
}
```

---

### Connexion Supabase

La `DATABASE_URL` doit pointer vers le PostgreSQL Supabase.
Format attendu dans `server/.env` :
```
DATABASE_URL=postgresql://postgres:[MOT_DE_PASSE_DB]@db.fytnuqnxadnsedyxxlzq.supabase.co:5432/postgres
```

> Le mot de passe DB est celui défini à la création du projet Supabase.
> Il se retrouve dans **Supabase dashboard → Settings → Database → Connection string**.

---

### Seed depuis mockData.js

Le seed (`server/prisma/seed.js`) doit :
- Lire les références depuis `veille-creative/src/data/mockData.js`
- Mapper les champs mock vers le schéma Prisma (attention aux noms de champs différents)
- Insérer avec `upsert` sur `url` pour être idempotent
- Marquer toutes les références seedées avec `status: PUBLISHED` et `sourceMode: MANUAL`

---

## CONTRAINTES

- Ne pas modifier les routes Express existantes (`/health`, `/api/v1/search`)
- Ne pas toucher au frontend React
- Utiliser `prisma migrate dev --name init` pour nommer la première migration
- Le seed doit être idempotent (relançable sans dupliquer les données)
- ESM partout — `seed.js` avec `import` et `"type": "module"` dans `package.json`

---

## PROMPT DE VALIDATION

> 1. Vérifier dans Supabase dashboard → Table Editor que les tables `Reference`, `IngestionSession`, `Creator` existent
> 2. Lancer `node prisma/seed.js` et vérifier qu'il affiche "X références insérées"
> 3. Ouvrir Supabase → Table Editor → `Reference` et vérifier que les lignes sont présentes avec `status = PUBLISHED`
> 4. Lancer `npx prisma studio` et vérifier que les données sont consultables

---

## CORRECTIFS POST-GÉNÉRATION

— À documenter après exécution
