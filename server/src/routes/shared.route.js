import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();

/**
 * GET /api/v1/shared/:token — treatment public en lecture seule (180-23).
 * Sans auth : le client final n'a pas de compte. N'expose que le nécessaire.
 */
router.get('/:token', asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { shareToken: req.params.token },
    select: {
      title: true,
      client: true,
      intention: true,
      deadline: true,
      updatedAt: true,
      user: { select: { firstName: true } },
      items: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          note: true,
          reference: {
            select: {
              url: true, title: true, channelName: true,
              thumbnailUrl: true, taxonomy: true,
            },
          },
        },
      },
    },
  });
  if (!project) return res.status(404).json({ error: 'Treatment introuvable ou lien révoqué' });
  res.json(project);
}));

export default router;
