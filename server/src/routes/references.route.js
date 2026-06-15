import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();

// Routes montées sous requireUser (app.js) → req.userId toujours présent.

/**
 * Set des referenceId sauvegardés par l'utilisateur parmi `ids`.
 * Une seule requête, scopée user → sert à enrichir les listes du flag `saved`.
 */
async function savedSet(userId, ids) {
  if (ids.length === 0) return new Set();
  const rows = await prisma.savedReference.findMany({
    where: { userId, referenceId: { in: ids } },
    select: { referenceId: true },
  });
  return new Set(rows.map(r => r.referenceId));
}

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
    // 180-67 : flag `saved` iso pour l'utilisateur connecté
    const saved = await savedSet(req.userId, rows.map(r => r.id));
    // 180-49 : les tags YouTube bruts ne sortent jamais vers le front public
    const references = rows.map(({ tags, sections, ...rest }) => ({
      ...rest,
      sectionIds: sections.map(s => s.sectionId),
      saved: saved.has(rest.id),
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
    const allIds = rows.flatMap(s => s.references.map(r => r.reference.id));
    const saved = await savedSet(req.userId, allIds);
    const sections = rows.map(({ references, ...section }) => ({
      ...section,
      references: references.map(({ reference: { tags, ...rest } }) => ({
        ...rest,
        saved: saved.has(rest.id),
      })),
    }));
    res.json({ sections });
  } catch (err) {
    console.error('[references] GET /sections', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/v1/references/:id/save — sauvegarde (idempotent via upsert)
 * 404 si la référence n'existe pas ou n'est pas PUBLISHED.
 */
router.put('/:id/save', asyncHandler(async (req, res) => {
  const ref = await prisma.reference.findFirst({
    where: { id: req.params.id, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!ref) return res.status(404).json({ error: 'Référence introuvable' });

  await prisma.savedReference.upsert({
    where: { userId_referenceId: { userId: req.userId, referenceId: ref.id } },
    create: { userId: req.userId, referenceId: ref.id },
    update: {},
  });
  res.json({ saved: true });
}));

/**
 * DELETE /api/v1/references/:id/save — retire la sauvegarde (idempotent)
 */
router.delete('/:id/save', asyncHandler(async (req, res) => {
  await prisma.savedReference.deleteMany({
    where: { userId: req.userId, referenceId: req.params.id },
  });
  res.json({ saved: false });
}));

export default router;
