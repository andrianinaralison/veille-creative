import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate, asyncHandler } from '../middleware/validate.js';

const router = Router();

const projectBodySchema = z.object({
  title: z.string().trim().min(1, 'Titre requis').max(200),
  client: z.string().trim().max(200).optional().default(''),
  brief: z.string().max(5000).optional().default(''),
  deadline: z.coerce.date().nullable().optional(),
});

const projectPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  client: z.string().trim().max(200).optional(),
  brief: z.string().max(5000).optional(),
  intention: z.string().max(10000).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'DONE']).optional(),
  deadline: z.coerce.date().nullable().optional(),
});

const itemsSchema = z.object({
  items: z.array(z.object({
    referenceId: z.string().min(1),
    note: z.string().max(2000).optional().default(''),
  })).max(20),
});

export const projectInclude = {
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

// Toutes les routes sont scopées au propriétaire : where { id, userId }
// → un projet d'un autre utilisateur est indistinguable d'un projet absent (404).

/**
 * GET /api/v1/projects — projets de l'utilisateur, plus récents d'abord
 */
router.get('/', asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { items: true } } },
  });
  res.json({ projects });
}));

/**
 * POST /api/v1/projects
 */
router.post('/', validate({ body: projectBodySchema }), asyncHandler(async (req, res) => {
  const { title, client, brief, deadline } = req.body;
  const project = await prisma.project.create({
    data: { userId: req.userId, title, client, brief, deadline: deadline ?? null },
    include: projectInclude,
  });
  res.status(201).json(project);
}));

/**
 * GET /api/v1/projects/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: projectInclude,
  });
  if (!project) return res.status(404).json({ error: 'Projet introuvable' });
  res.json(project);
}));

/**
 * PATCH /api/v1/projects/:id
 */
router.patch('/:id', validate({ body: projectPatchSchema }), asyncHandler(async (req, res) => {
  const { count } = await prisma.project.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: req.body,
  });
  if (count === 0) return res.status(404).json({ error: 'Projet introuvable' });
  const project = await prisma.project.findUnique({ where: { id: req.params.id }, include: projectInclude });
  res.json(project);
}));

/**
 * PUT /api/v1/projects/:id/items — remplace la sélection (ordre = ordre du tableau)
 */
router.put('/:id/items', validate({ body: itemsSchema }), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  const project = await prisma.project.findFirst({ where: { id, userId: req.userId }, select: { id: true } });
  if (!project) return res.status(404).json({ error: 'Projet introuvable' });

  const refIds = items.map(i => i.referenceId);
  const published = await prisma.reference.count({ where: { id: { in: refIds }, status: 'PUBLISHED' } });
  if (published !== new Set(refIds).size) {
    return res.status(400).json({ error: 'Toutes les références doivent exister et être PUBLISHED' });
  }

  await prisma.$transaction([
    prisma.projectItem.deleteMany({ where: { projectId: id } }),
    prisma.projectItem.createMany({
      data: items.map((item, idx) => ({
        projectId: id, referenceId: item.referenceId, position: idx, note: item.note ?? '',
      })),
    }),
    // updatedAt reflète la dernière composition, pas seulement les champs du projet
    prisma.project.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);

  const updated = await prisma.project.findUnique({ where: { id }, include: projectInclude });
  res.json(updated);
}));

/**
 * POST /api/v1/projects/:id/share — génère (ou renvoie) le lien public (180-23)
 */
router.post('/:id/share', asyncHandler(async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    select: { id: true, shareToken: true },
  });
  if (!project) return res.status(404).json({ error: 'Projet introuvable' });

  let { shareToken } = project;
  if (!shareToken) {
    shareToken = crypto.randomUUID().replace(/-/g, '');
    await prisma.project.update({ where: { id: project.id }, data: { shareToken } });
  }
  res.json({ shareToken });
}));

/**
 * DELETE /api/v1/projects/:id/share — révoque le lien public
 */
router.delete('/:id/share', asyncHandler(async (req, res) => {
  const { count } = await prisma.project.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data: { shareToken: null },
  });
  if (count === 0) return res.status(404).json({ error: 'Projet introuvable' });
  res.json({ ok: true });
}));

/**
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { count } = await prisma.project.deleteMany({
    where: { id: req.params.id, userId: req.userId },
  });
  if (count === 0) return res.status(404).json({ error: 'Projet introuvable' });
  res.json({ ok: true });
}));

export default router;
