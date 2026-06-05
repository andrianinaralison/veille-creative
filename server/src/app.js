import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import searchRoute from './routes/search.route.js';
import adminRoute from './routes/admin.route.js';
import adminSectionsRoute from './routes/admin-sections.route.js';
import referencesRoute from './routes/references.route.js';
import ingestionRoute from './routes/ingestion.route.js';
import authRoute from './routes/auth.route.js';
import { requireAdmin } from './middleware/require-admin.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
  app.use(express.json());

  // ── Routes publiques ────────────────────────────────────────────────────────
  app.use('/api/v1/search', searchRoute);
  app.use('/api/v1/references', referencesRoute);
  app.use('/api/v1/admin/login', authRoute);

  // ── Routes admin (protégées) ────────────────────────────────────────────────
  app.use('/api/v1/admin', requireAdmin, adminRoute);
  app.use('/api/v1/admin/sections', requireAdmin, adminSectionsRoute);

  // ── Routes ingestion (protégées + rate-limit 10 req/15 min) ────────────────
  const ingestionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
  });
  app.use('/api/v1/ingestion', requireAdmin, ingestionLimiter, ingestionRoute);

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ ok: true }));

  return app;
}
