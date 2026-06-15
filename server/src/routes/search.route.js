import { Router } from 'express';
import { extractSearchFilters } from '../services/search.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * POST /api/v1/search
 * Body: { query: string }
 * Extrait les filtres NL via Claude puis requête les références PUBLISHED en BDD.
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

  // Construire la clause WHERE Prisma à partir des filtres extraits
  const semanticFilters = [];
  if (filters.tags?.length)       semanticFilters.push({ taxonomy: { hasSome: filters.tags } });
  if (filters.mood)               semanticFilters.push({ mood: { equals: filters.mood, mode: 'insensitive' } });
  if (filters.type_contenu)       semanticFilters.push({ typeContenu: { contains: filters.type_contenu, mode: 'insensitive' } });
  if (filters.platform)           semanticFilters.push({ platform: filters.platform.toUpperCase() });

  const where = {
    status: 'PUBLISHED',
    ...(semanticFilters.length > 0 ? { OR: semanticFilters } : {}),
  };

  const results = await prisma.reference.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: {
      id: true, url: true, platform: true, title: true,
      channelName: true, channelUrl: true, channelAvatarUrl: true,
      thumbnailUrl: true, taxonomy: true, mood: true, typeContenu: true,
      context: true, publishedAt: true, awards: true,
      sections: { select: { sectionId: true } },
    },
  });

  const formatted = results.map(({ sections, ...rest }) => ({
    ...rest,
    sectionIds: sections.map(s => s.sectionId),
  }));

  const isDev = process.env.NODE_ENV !== 'production';

  res.json({
    mode: filters.mode,
    filters_applied: { tags: filters.tags, type_contenu: filters.type_contenu, mood: filters.mood, platform: filters.platform },
    total: formatted.length,
    results: formatted,
    ...(isDev && { _debug: { usage: filters._usage } }),
  });
});

export default router;
