import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import searchRoute from './routes/search.route.js';
import adminRoute from './routes/admin.route.js';
import adminSectionsRoute from './routes/admin-sections.route.js';
import referencesRoute from './routes/references.route.js';
import ingestionRoute from './routes/ingestion.route.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes publiques
app.use('/api/v1/search', searchRoute);
app.use('/api/v1/references', referencesRoute);

// Routes admin
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/admin/sections', adminSectionsRoute);

// Routes ingestion
app.use('/api/v1/ingestion', ingestionRoute);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
