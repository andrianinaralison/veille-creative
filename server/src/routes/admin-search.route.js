import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { extractSearchFilters } from '../services/search.service.js';

const router = Router();

/**
 * POST /api/v1/admin/search
 * Smart search NL sur le backoffice — scope configurable (défaut: TRIAGE).
 * Body: { query: string, status?: 'TRIAGE' | 'DRAFT' | 'PUBLISHED' | 'REJECTED', sessionId?: string }
 *
 * Extrait tags/mood/typeContenu via Claude puis filtre les références en BDD.
 * Les références qui ne matchent aucun filtre sont exclues du résultat.
 */
router.post('/', async (req, res) => {
  const { query, status = 'TRIAGE', sessionId } = req.body ?? {};

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Le champ "query" est requis.' });
  }
  if (query.length > 1000) {
    return res.status(400).json({ error: 'La requête ne peut pas dépasser 1 000 caractères.' });
  }

  try {
    const filters = await extractSearchFilters(query.trim());

    // Construire la clause where Prisma
    const where = {
      status,
      ...(sessionId ? { ingestionSessionId: sessionId } : {}),
    };

    // Filtre tags : la référence doit avoir AU MOINS UN des tags extraits
    const tagFilter = filters.tags?.length
      ? { tags: { hasSome: filters.tags } }
      : null;

    // Filtre mood
    const moodFilter = filters.mood
      ? { mood: { equals: filters.mood, mode: 'insensitive' } }
      : null;

    // Filtre typeContenu
    const typeFilter = filters.type_contenu
      ? { typeContenu: { contains: filters.type_contenu, mode: 'insensitive' } }
      : null;

    // Filtre platform
    const platformFilter = filters.platform
      ? { platform: filters.platform.toUpperCase() }
      : null;

    // OR entre les filtres sémantiques — si aucun filtre extrait, renvoie tout le scope
    const semanticFilters = [tagFilter, moodFilter, typeFilter, platformFilter].filter(Boolean);
    if (semanticFilters.length > 0) {
      where.OR = semanticFilters;
    }

    const references = await prisma.reference.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        url: true,
        platform: true,
        title: true,
        channelName: true,
        thumbnailUrl: true,
        tags: true,
        mood: true,
        typeContenu: true,
        status: true,
        ingestionSessionId: true,
        createdAt: true,
      },
    });

    const isDev = process.env.NODE_ENV !== 'production';

    res.json({
      mode: filters.mode,
      filters_applied: {
        tags: filters.tags,
        type_contenu: filters.type_contenu,
        mood: filters.mood,
        platform: filters.platform,
      },
      total: references.length,
      references,
      ...(isDev && { _debug: { usage: filters._usage } }),
    });
  } catch (err) {
    console.error('[admin-search] POST /', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
