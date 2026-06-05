# 180 Degrés

[![CI](https://github.com/andrianinaralison/veille-creative/actions/workflows/ci.yml/badge.svg)](https://github.com/andrianinaralison/veille-creative/actions/workflows/ci.yml)

Plateforme de veille créative pour vidéastes indépendants français.

## Stack

| Couche | Techno |
|---|---|
| Frontend | React 19 + Vite + Tailwind + Zustand |
| Backend | Node.js 22 + Express + Prisma + PostgreSQL 16 |
| IA | Claude API `claude-sonnet-4-6` |
| Storage | Supabase Storage (CDN thumbnails) |

## Démarrage local

```bash
# Backend
cd server
cp .env.example .env   # remplir les variables
npm install
npm run dev            # http://localhost:3001

# Frontend
cd veille-creative
npm install
npm run dev            # http://localhost:5173
```

## Admin

Accès backoffice : `http://localhost:5173/admin`
Mot de passe par défaut : `admin180` (à changer en prod via `ADMIN_PASSWORD_HASH`)

## Tests

```bash
cd server && npm test
```

## Process

- Roadmap : [`docs/ROADMAP.md`](docs/ROADMAP.md)
- Way of Working : [`docs/WAY-OF-WORKING.md`](docs/WAY-OF-WORKING.md)
- Contributions : [`CONTRIBUTING.md`](CONTRIBUTING.md)
