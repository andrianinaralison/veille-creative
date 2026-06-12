import 'dotenv/config';
import { createApp } from './app.js';

// ── Fail-fast : variables critiques ──────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'ADMIN_PASSWORD_HASH', 'ANTHROPIC_API_KEY', 'DATABASE_URL', 'YOUTUBE_API_KEY']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length) {
  console.error(`[FATAL] Variables d'environnement manquantes : ${missing.join(', ')}`)
  process.exit(1)
}

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
