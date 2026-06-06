import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate, asyncHandler, paginationSchema, refStatusSchema } from '../middleware/validate.js';

const router = Router();

const refsQuerySchema = paginationSchema.extend({
  status: refStatusSchema.optional(),
});

/**
 * GET /api/v1/admin/references
 * Liste toutes les références — filtrables par statut.
 * Query params : ?status=TRIAGE|DRAFT|PUBLISHED|REJECTED, ?limit (max 200), ?offset
 */
router.get('/references', validate({ query: refsQuerySchema }), asyncHandler(async (req, res) => {
  const { status, limit, offset } = req.query;
  const where = status ? { status } : {};

  const [references, total] = await Promise.all([
    prisma.reference.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
    prisma.reference.count({ where }),
  ]);

  res.json({ references, total });
}));

/**
 * PATCH /api/v1/admin/references/:id/status
 * Met à jour le statut d'une référence (DRAFT → PUBLISHED | REJECTED).
 * Body : { status: 'PUBLISHED' | 'REJECTED' | 'DRAFT' }
 */
router.patch('/references/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['TRIAGE', 'DRAFT', 'PUBLISHED', 'REJECTED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Valeurs : ${allowed.join(', ')}` });
  }

  try {
    const updated = await prisma.reference.update({
      where: { id },
      data: {
        status,
        ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Référence introuvable' });
    }
    console.error('[admin] PATCH /references/:id/status', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/references/batch
 * Actions en masse sur une sélection de références.
 * Body : { ids: string[], action: 'status' | 'addTags' | 'delete', value?: any }
 *   - action 'status'  : value = 'DRAFT' | 'PUBLISHED' | 'REJECTED'
 *   - action 'addTags' : value = string[]  (ajoutés sans écraser les existants)
 *   - action 'delete'  : value = undefined
 */
router.post('/references/batch', async (req, res) => {
  const { ids, action, value } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids requis (tableau non vide)' });
  }

  try {
    if (action === 'status') {
      const allowed = ['TRIAGE', 'DRAFT', 'PUBLISHED', 'REJECTED'];
      if (!allowed.includes(value)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      await prisma.reference.updateMany({
        where: { id: { in: ids } },
        data: {
          status: value,
          ...(value === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
        },
      });
      return res.json({ ok: true, affected: ids.length });
    }

    if (action === 'addTags') {
      if (!Array.isArray(value) || value.length === 0) {
        return res.status(400).json({ error: 'value doit être un tableau de tags' });
      }
      // Prisma n'expose pas d'opérateur array-append pour updateMany.
      // $transaction(array) envoie N updates en un seul round-trip réseau.
      const refs = await prisma.reference.findMany({
        where: { id: { in: ids } },
        select: { id: true, tags: true },
      });
      await prisma.$transaction(
        refs.map(r => prisma.reference.update({
          where: { id: r.id },
          data: { tags: [...new Set([...r.tags, ...value])] },
        }))
      );
      return res.json({ ok: true, affected: ids.length });
    }

    if (action === 'delete') {
      await prisma.reference.deleteMany({ where: { id: { in: ids } } });
      return res.json({ ok: true, affected: ids.length });
    }

    return res.status(400).json({ error: 'action invalide : status | addTags | delete' });
  } catch (err) {
    console.error('[admin] POST /references/batch', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/v1/admin/triage/count
 * Compteur de références en TRIAGE, global et par session.
 * Query params : ?sessionId=xxx (optionnel)
 */
router.get('/triage/count', async (req, res) => {
  const { sessionId } = req.query;
  const where = { status: 'TRIAGE', ...(sessionId ? { ingestionSessionId: sessionId } : {}) };
  try {
    const count = await prisma.reference.count({ where });
    res.json({ count });
  } catch (err) {
    console.error('[admin] GET /triage/count', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/v1/admin/references/:id
 * Édite les champs éditoriaux + status + sectionId en une seule transaction atomique.
 * Body (tous optionnels) : { title, tags, mood, context, typeContenu, status, sectionId }
 */
router.patch('/references/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, tags, mood, context, typeContenu, status, sectionId } = req.body;

  const data = {};
  if (title !== undefined)       data.title = title;
  if (tags !== undefined)        data.tags = tags;
  if (mood !== undefined)        data.mood = mood;
  if (context !== undefined)     data.context = context;
  if (typeContenu !== undefined) data.typeContenu = typeContenu;
  if (sectionId !== undefined)   data.sectionId = sectionId; // null = désassigner
  if (status !== undefined) {
    const parsed = refStatusSchema.safeParse(status);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Statut invalide', details: parsed.error.issues.map(e => ({ path: e.path.join('.'), message: e.message })) });
    }
    data.status = parsed.data;
    if (parsed.data === 'PUBLISHED') data.publishedAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  }

  const updated = await prisma.reference.update({ where: { id }, data });
  res.json(updated);
}));

/**
 * DELETE /api/v1/admin/references/:id
 */
router.delete('/references/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.reference.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Référence introuvable' });
    console.error('[admin] DELETE /references/:id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Creators CRUD ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/creators
 */
router.get('/creators', async (_req, res) => {
  try {
    const creators = await prisma.creator.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ creators });
  } catch (err) {
    console.error('[admin] GET /creators', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/creators
 * Body : { name, youtubeHandle?, instagramHandle?, vimeoUrl?, websiteUrl? }
 * Au moins un profil requis (youtubeHandle recommandé pour le scan).
 */
router.post('/creators', async (req, res) => {
  const { name, youtubeHandle, instagramHandle, vimeoUrl, websiteUrl } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'name requis' });
  }

  // Dériver url depuis youtubeHandle pour compatibilité avec resolveChannelId
  const rawHandle = youtubeHandle?.trim() || null;
  const url = rawHandle
    ? (rawHandle.startsWith('http') ? rawHandle : `https://www.youtube.com/@${rawHandle.replace(/^@/, '')}`)
    : null;

  try {
    const creator = await prisma.creator.create({
      data: {
        name: name.trim(),
        url,
        youtubeHandle: rawHandle,
        instagramHandle: instagramHandle?.trim() || null,
        vimeoUrl: vimeoUrl?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        platform: 'YOUTUBE',
        active: true,
      },
    });
    res.status(201).json(creator);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ce handle YouTube est déjà enregistré' });
    }
    console.error('[admin] POST /creators', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/v1/admin/creators/:id
 * Body : { active?, name?, youtubeHandle?, instagramHandle?, vimeoUrl?, websiteUrl? }
 */
router.patch('/creators/:id', async (req, res) => {
  const { id } = req.params;
  const { active, name, youtubeHandle, instagramHandle, vimeoUrl, websiteUrl } = req.body;

  const data = {};
  if (active !== undefined) data.active = active;
  if (name !== undefined) data.name = name;
  if (instagramHandle !== undefined) data.instagramHandle = instagramHandle;
  if (vimeoUrl !== undefined) data.vimeoUrl = vimeoUrl;
  if (websiteUrl !== undefined) data.websiteUrl = websiteUrl;
  if (youtubeHandle !== undefined) {
    const rawHandle = youtubeHandle?.trim() || null;
    data.youtubeHandle = rawHandle;
    data.url = rawHandle
      ? (rawHandle.startsWith('http') ? rawHandle : `https://www.youtube.com/@${rawHandle.replace(/^@/, '')}`)
      : null;
  }

  try {
    const updated = await prisma.creator.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Créateur introuvable' });
    console.error('[admin] PATCH /creators/:id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/v1/admin/creators/:id
 */
router.delete('/creators/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.creator.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Créateur introuvable' });
    console.error('[admin] DELETE /creators/:id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/publish
 * Signal de publication — les changements sont déjà en DB,
 * cet endpoint confirme et retourne un timestamp pour les clients qui écoutent.
 */
router.post('/publish', (_req, res) => {
  res.json({ ok: true, publishedAt: new Date().toISOString() });
});

export default router;
