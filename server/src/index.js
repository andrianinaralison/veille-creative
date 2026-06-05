import 'dotenv/config';
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

// ── Fail-fast : variables critiques ──────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'ADMIN_PASSWORD_HASH', 'ANTHROPIC_API_KEY', 'DATABASE_URL', 'YOUTUBE_API_KEY']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length) {
  console.error(`[FATAL] Variables d'environnement manquantes : ${missing.join(', ')}`)
  process.exit(1)
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes publiques ──────────────────────────────────────────────────────────
app.use('/api/v1/search', searchRoute);
app.use('/api/v1/references', referencesRoute);
app.use('/api/v1/admin/login', authRoute);

// ── Routes admin (protégées) ──────────────────────────────────────────────────
app.use('/api/v1/admin', requireAdmin, adminRoute);
app.use('/api/v1/admin/sections', requireAdmin, adminSectionsRoute);

// ── Routes ingestion (protégées + rate-limit 10 req/15 min) ──────────────────
const ingestionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
})
app.use('/api/v1/ingestion', requireAdmin, ingestionLimiter, ingestionRoute);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
