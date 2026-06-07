import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const VALID_TYPES = ['keyword_title', 'channel_name', 'duration_max'];

/**
 * GET /api/v1/admin/filter-rules?creatorId=xxx
 * Liste les règles actives, optionnellement filtrées par créateur.
 */
router.get('/', async (req, res) => {
  const { creatorId } = req.query;
  try {
    const rules = await prisma.filterRule.findMany({
      where: { ...(creatorId ? { creatorId } : {}), active: true },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { name: true } } },
    });
    res.json({ rules });
  } catch (err) {
    console.error('[filter-rules] GET /', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/filter-rules
 * Crée une règle de filtrage.
 * Body : { creatorId, type, pattern }
 */
router.post('/', async (req, res) => {
  const { creatorId, type, pattern } = req.body ?? {};
  if (!creatorId || !type || !pattern?.trim()) {
    return res.status(400).json({ error: 'creatorId, type et pattern requis' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type invalide. Valeurs : ${VALID_TYPES.join(', ')}` });
  }
  if (type === 'duration_max') {
    const dur = parseInt(pattern, 10);
    if (isNaN(dur) || dur <= 0) {
      return res.status(400).json({ error: 'duration_max doit être un entier positif (secondes)' });
    }
  }
  try {
    const rule = await prisma.filterRule.create({
      data: { creatorId, type, pattern: pattern.trim().toLowerCase() },
    });
    res.status(201).json(rule);
  } catch (err) {
    if (err.code === 'P2003') return res.status(404).json({ error: 'Créateur introuvable' });
    console.error('[filter-rules] POST /', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/v1/admin/filter-rules/:id
 * Désactive une règle (soft delete via active=false).
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.filterRule.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Règle introuvable' });
    console.error('[filter-rules] DELETE /:id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
