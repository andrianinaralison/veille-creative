import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate, asyncHandler, paginationSchema } from '../middleware/validate.js';

const router = Router();

// Annotations privées (180-74) : tags libres + note, réutilisables en treatment.
const annotationSchema = z.object({
  userTags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  note: z.string().max(2000).optional(),
});

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
 * PATCH /api/v1/library/:id — met à jour les annotations privées (tags + note) d'une
 * réf sauvegardée. 404 si la réf n'est pas dans le vivier de l'utilisateur.
 */
router.patch('/:id', validate({ body: annotationSchema }), asyncHandler(async (req, res) => {
  const data = {};
  if (req.body.userTags !== undefined) data.userTags = [...new Set(req.body.userTags)];
  if (req.body.note !== undefined) data.note = req.body.note;
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Rien à mettre à jour' });
  }

  try {
    const row = await prisma.savedReference.update({
      where: { userId_referenceId: { userId: req.userId, referenceId: req.params.id } },
      data,
      select: { userTags: true, note: true },
    });
    res.json(row);
  } catch (err) {
    // P2025 = record introuvable → la réf n'est pas dans le vivier de l'utilisateur
    if (err.code === 'P2025') return res.status(404).json({ error: 'Référence non sauvegardée' });
    throw err;
  }
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
