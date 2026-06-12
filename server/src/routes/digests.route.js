import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();

const itemsInclude = {
  items: {
    orderBy: { position: 'asc' },
    include: {
      reference: {
        select: {
          id: true, url: true, title: true, channelName: true, channelUrl: true,
          thumbnailUrl: true, channelAvatarUrl: true, taxonomy: true, mood: true,
          typeContenu: true, context: true, platform: true,
        },
      },
    },
  },
};

/**
 * GET /api/v1/digests — archives publiées (léger, sans items)
 */
router.get('/', asyncHandler(async (_req, res) => {
  const digests = await prisma.digest.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { weekOf: 'desc' },
    select: {
      id: true, weekOf: true, title: true, publishedAt: true,
      _count: { select: { items: true } },
    },
  });
  res.json({ digests });
}));

/**
 * GET /api/v1/digests/latest — dernier digest publié, items inclus
 */
router.get('/latest', asyncHandler(async (_req, res) => {
  const digest = await prisma.digest.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { weekOf: 'desc' },
    include: itemsInclude,
  });
  if (!digest) return res.status(404).json({ error: 'Aucun digest publié' });
  res.json(digest);
}));

/**
 * GET /api/v1/digests/:id — un digest publié
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const digest = await prisma.digest.findFirst({
    where: { id: req.params.id, status: 'PUBLISHED' },
    include: itemsInclude,
  });
  if (!digest) return res.status(404).json({ error: 'Digest introuvable' });
  res.json(digest);
}));

export default router;
