import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { validate, asyncHandler, paginationSchema } from '../middleware/validate.js';

const router = Router();

// Monté sous requireUser (app.js) → req.userId toujours présent.

/**
 * GET /api/v1/library — vivier paginé : références sauvegardées encore PUBLISHED,
 * plus récemment sauvegardées d'abord. Alimente la grille Bibliothèque (180-73, lazy-load).
 * Query : ?limit= (def 50, max 200), ?offset=
 * Le filtre PUBLISHED est appliqué en base (sur la relation) pour que la pagination
 * reste correcte (une réf dé-publiée disparaît du vivier sans trouer les pages).
 */
router.get('/', validate({ query: paginationSchema }), asyncHandler(async (req, res) => {
  const { limit, offset } = req.query;
  const where = { userId: req.userId, reference: { status: 'PUBLISHED' } };

  const [rows, total] = await Promise.all([
    prisma.savedReference.findMany({
      where,
      orderBy: { savedAt: 'desc' },
      take: limit,
      skip: offset,
      include: { reference: true },
    }),
    prisma.savedReference.count({ where }),
  ]);

  // 180-49 : les tags YouTube bruts ne sortent jamais vers le front
  const references = rows.map(({ reference: { tags, ...ref }, savedAt, userTags, note }) => ({
    ...ref,
    saved: true,
    savedAt,
    userTags,
    note,
  }));

  res.json({ references, total });
}));

/**
 * GET /api/v1/library/ids — identifiants des refs sauvegardées (léger, sans jointure).
 * Sert d'état global « saved » au front (hydrate du store) sans charger les objets.
 */
router.get('/ids', asyncHandler(async (req, res) => {
  const rows = await prisma.savedReference.findMany({
    where: { userId: req.userId },
    select: { referenceId: true },
  });
  res.json({ ids: rows.map(r => r.referenceId) });
}));

export default router;
