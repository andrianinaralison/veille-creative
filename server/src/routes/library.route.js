import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();

// Monté sous requireUser (app.js) → req.userId toujours présent.

/**
 * GET /api/v1/library — le vivier de l'utilisateur : ses références sauvegardées,
 * plus récemment sauvegardées d'abord. Alimente la Bibliothèque (180-73).
 * On ne renvoie que les refs encore PUBLISHED (une réf dé-publiée disparaît du vivier).
 */
router.get('/', asyncHandler(async (req, res) => {
  const rows = await prisma.savedReference.findMany({
    where: { userId: req.userId },
    orderBy: { savedAt: 'desc' },
    include: { reference: true },
  });

  // 180-49 : les tags YouTube bruts ne sortent jamais vers le front
  const references = rows
    .filter(r => r.reference?.status === 'PUBLISHED')
    .map(({ reference: { tags, ...ref }, savedAt, userTags, note }) => ({
      ...ref,
      saved: true,
      savedAt,
      userTags,
      note,
    }));

  res.json({ references, total: references.length });
}));

export default router;
