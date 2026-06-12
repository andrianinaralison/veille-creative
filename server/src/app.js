import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import searchRoute from './routes/search.route.js';
import adminRoute from './routes/admin.route.js';
import adminSectionsRoute from './routes/admin-sections.route.js';
import referencesRoute from './routes/references.route.js';
import ingestionRoute from './routes/ingestion.route.js';
import authRoute from './routes/auth.route.js';
import userAuthRoute from './routes/user-auth.route.js';
import filterRulesRoute from './routes/filter-rules.route.js';
import adminSearchRoute from './routes/admin-search.route.js';
import adminDigestsRoute from './routes/admin-digests.route.js';
import digestsRoute from './routes/digests.route.js';
import projectsRoute from './routes/projects.route.js';
import sharedRoute from './routes/shared.route.js';
import { requireAdmin } from './middleware/require-admin.js';
import { requireUser } from './middleware/require-user.js';
import { prisma } from './lib/prisma.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
  app.use(express.json());

  // ── Auth utilisateurs (180-16) ─────────────────────────────────────────────
  // Rate-limit anti brute-force sur signup/login (POST) — GET /me non limité
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Trop de tentatives, réessaie dans 15 minutes.' },
  });
  const authPostLimiter = (req, res, next) =>
    req.method === 'POST' ? authLimiter(req, res, next) : next();
  app.use('/api/v1/auth', authPostLimiter, userAuthRoute);

  // ── Contenu — réservé aux utilisateurs connectés (DoD 180-16) ──────────────
  app.use('/api/v1/search', requireUser, searchRoute);
  app.use('/api/v1/references', requireUser, referencesRoute);
  app.use('/api/v1/digests', requireUser, digestsRoute);
  app.use('/api/v1/projects', requireUser, projectsRoute);
  // Treatment partagé — public : le client final n'a pas de compte (180-23)
  app.use('/api/v1/shared', sharedRoute);

  // ── Login admin (public) ────────────────────────────────────────────────────
  app.use('/api/v1/admin/login', authRoute);

  // ── Routes admin (protégées) ────────────────────────────────────────────────
  app.use('/api/v1/admin', requireAdmin, adminRoute);
  app.use('/api/v1/admin/sections', requireAdmin, adminSectionsRoute);
  app.use('/api/v1/admin/filter-rules', requireAdmin, filterRulesRoute);
  app.use('/api/v1/admin/search', requireAdmin, adminSearchRoute);
  app.use('/api/v1/admin/digests', requireAdmin, adminDigestsRoute);

  // ── Routes ingestion (protégées) ────────────────────────────────────────────
  // Rate-limit sur les POST uniquement (lancement de scan) — les GET de polling
  // s'exécutent toutes les 2 s et ne doivent pas être limités.
  const ingestionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
  });
  const postOnlyLimiter = (req, res, next) =>
    req.method === 'POST' ? ingestionLimiter(req, res, next) : next();
  app.use('/api/v1/ingestion', requireAdmin, postOnlyLimiter, ingestionRoute);

  // ── Health check — teste réellement la connexion DB ────────────────────────
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: 'connected' });
    } catch {
      res.status(503).json({ ok: false, db: 'unreachable' });
    }
  });

  // ── Middleware d'erreur centralisé ──────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message ?? 'Erreur serveur';
    console.error({ level: 'error', route: req.path, method: req.method, status, message, stack: err.stack });
    res.status(status).json({ error: message });
  });

  return app;
}
