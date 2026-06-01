import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/references
 * Références PUBLISHED uniquement — consommé par le front public (LibraryPage).
 * Query : ?sectionId=, ?limit=, ?offset=
 */
router.get('/', async (req, res) => {
  const { sectionId, limit = '200', offset = '0' } = req.query;

  const where = {
    status: 'PUBLISHED',
    ...(sectionId ? { sectionId } : {}),
  };

  try {
    const [references, total] = await Promise.all([
      prisma.reference.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.reference.count({ where }),
    ]);
    res.json({ references, total });
  } catch (err) {
    console.error('[references] GET /', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/v1/references/sections
 * Toutes les sections avec leurs références PUBLISHED, ordonnées par position.
 */
router.get('/sections', async (req, res) => {
  try {
    const sections = await prisma.section.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
      include: {
        references: {
          where: { status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
        },
      },
    });
    res.json({ sections });
  } catch (err) {
    console.error('[references] GET /sections', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
