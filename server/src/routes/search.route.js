import { Router } from 'express';
import { extractSearchFilters } from '../services/search.service.js';

const router = Router();

/**
 * POST /api/v1/search
 * Body: { query: string }
 */
router.post('/', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Le champ "query" est requis.' });
  }

  if (query.length > 1000) {
    return res.status(400).json({ error: 'La requête ne peut pas dépasser 1 000 caractères.' });
  }

  const filters = await extractSearchFilters(query.trim());

  // En dev, on renvoie _usage pour monitorer les cache hits
  const isDev = process.env.NODE_ENV !== 'production';

  res.json({
    mode: filters.mode,
    filters_applied: {
      tags: filters.tags,
      type_contenu: filters.type_contenu,
      mood: filters.mood,
      platform: filters.platform,
    },
    // Résultats SQL à brancher ici (phase 7 du backlog)
    results: [],
    ...(isDev && { _debug: { usage: filters._usage } }),
  });
});

export default router;
