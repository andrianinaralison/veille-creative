import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/references
 * Références PUBLISHED uniquement — consommé par le front (LibraryPage, feed Dashboard).
 * Query : ?sectionId=, ?limit=, ?offset=, ?mood=, ?typeContenu= (180-18 filtres feed)
 */
router.get('/', async (req, res) => {
  const { sectionId, limit = '200', offset = '0', mood, typeContenu } = req.query;

  const where = {
    status: 'PUBLISHED',
    ...(sectionId ? { sections: { some: { sectionId } } } : {}),
    ...(mood ? { mood: { equals: mood, mode: 'insensitive' } } : {}),
    ...(typeContenu ? { typeContenu: { equals: typeContenu, mode: 'insensitive' } } : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      prisma.reference.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
        include: { sections: { select: { sectionId: true } } },
      }),
      prisma.reference.count({ where }),
    ]);
    // 180-49 : les tags YouTube bruts ne sortent jamais vers le front public
    const references = rows.map(({ tags, sections, ...rest }) => ({
      ...rest,
      sectionIds: sections.map(s => s.sectionId),
    }));
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
    const rows = await prisma.section.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
      include: {
        references: {
          where: { reference: { status: 'PUBLISHED' } },
          orderBy: [{ position: 'asc' }, { reference: { publishedAt: 'desc' } }],
          include: { reference: true },
        },
      },
    });
    const sections = rows.map(({ references, ...section }) => ({
      ...section,
      references: references.map(({ reference: { tags, ...rest } }) => rest),
    }));
    res.json({ sections });
  } catch (err) {
    console.error('[references] GET /sections', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
