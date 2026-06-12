import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate, asyncHandler } from '../middleware/validate.js';

const router = Router();

const digestBodySchema = z.object({
  weekOf: z.coerce.date(),
  title: z.string().trim().min(1, 'Titre requis').max(200),
  intro: z.string().max(5000).optional().default(''),
});

const digestPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  intro: z.string().max(5000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

const itemsSchema = z.object({
  items: z.array(z.object({
    referenceId: z.string().min(1),
    note: z.string().max(1000).optional().default(''),
  })).max(30),
});

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
 * GET /api/v1/admin/digests — tous les digests, items inclus
 */
router.get('/', asyncHandler(async (_req, res) => {
  const digests = await prisma.digest.findMany({
    orderBy: { weekOf: 'desc' },
    include: itemsInclude,
  });
  res.json({ digests });
}));

/**
 * POST /api/v1/admin/digests — créer un brouillon
 * Body : { weekOf, title, intro? }
 */
router.post('/', validate({ body: digestBodySchema }), asyncHandler(async (req, res) => {
  const { weekOf, title, intro } = req.body;
  try {
    const digest = await prisma.digest.create({ data: { weekOf, title, intro }, include: itemsInclude });
    res.status(201).json(digest);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Un digest existe déjà pour cette semaine' });
    }
    throw err;
  }
}));

/**
 * PATCH /api/v1/admin/digests/:id — éditer titre/intro, publier/dépublier
 */
router.patch('/:id', validate({ body: digestPatchSchema }), asyncHandler(async (req, res) => {
  const { title, intro, status } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (intro !== undefined) data.intro = intro;
  if (status !== undefined) {
    data.status = status;
    if (status === 'PUBLISHED') data.publishedAt = new Date();
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  }

  if (data.status === 'PUBLISHED') {
    const count = await prisma.digestItem.count({ where: { digestId: req.params.id } });
    if (count === 0) {
      return res.status(400).json({ error: 'Impossible de publier un digest vide' });
    }
  }

  try {
    const digest = await prisma.digest.update({ where: { id: req.params.id }, data, include: itemsInclude });
    res.json(digest);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Digest introuvable' });
    throw err;
  }
}));

/**
 * PUT /api/v1/admin/digests/:id/items — remplace la sélection (ordre = ordre du tableau)
 * Body : { items: [{ referenceId, note? }] }
 */
router.put('/:id/items', validate({ body: itemsSchema }), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  const digest = await prisma.digest.findUnique({ where: { id }, select: { id: true } });
  if (!digest) return res.status(404).json({ error: 'Digest introuvable' });

  const refIds = items.map(i => i.referenceId);
  const published = await prisma.reference.count({ where: { id: { in: refIds }, status: 'PUBLISHED' } });
  if (published !== new Set(refIds).size) {
    return res.status(400).json({ error: 'Toutes les références doivent exister et être PUBLISHED' });
  }

  await prisma.$transaction([
    prisma.digestItem.deleteMany({ where: { digestId: id } }),
    prisma.digestItem.createMany({
      data: items.map((item, idx) => ({
        digestId: id, referenceId: item.referenceId, position: idx, note: item.note ?? '',
      })),
    }),
  ]);

  const updated = await prisma.digest.findUnique({ where: { id }, include: itemsInclude });
  res.json(updated);
}));

/**
 * DELETE /api/v1/admin/digests/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await prisma.digest.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Digest introuvable' });
    throw err;
  }
}));

export default router;
