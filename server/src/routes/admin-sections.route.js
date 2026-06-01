import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const router = Router();

/** GET /api/v1/admin/sections — toutes les sections avec compte de refs */
router.get('/', async (_req, res) => {
  try {
    const sections = await prisma.section.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { references: true } } },
    });
    res.json({ sections });
  } catch (err) {
    console.error('[admin/sections] GET /', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** POST /api/v1/admin/sections — créer une section */
router.post('/', async (req, res) => {
  const { title, description = '', position = 0 } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title requis' });

  const slug = title.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    const section = await prisma.section.create({
      data: { title: title.trim(), slug, description, position },
    });
    res.status(201).json(section);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Slug déjà utilisé' });
    console.error('[admin/sections] POST /', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** PATCH /api/v1/admin/sections/:id — modifier titre / description / position / active */
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, position, active } = req.body;
  const data = {};
  if (title !== undefined) {
    data.title = title;
    data.slug = title.trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (description !== undefined) data.description = description;
  if (position !== undefined) data.position = position;
  if (active !== undefined) data.active = active;

  try {
    const updated = await prisma.section.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Section introuvable' });
    console.error('[admin/sections] PATCH /:id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/** DELETE /api/v1/admin/sections/:id — supprimer (les refs gardent sectionId=null) */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Section introuvable' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/sections/:id/assign
 * Assigne des références à cette section.
 * Body : { refIds: string[] }
 */
router.post('/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { refIds } = req.body;
  if (!Array.isArray(refIds)) return res.status(400).json({ error: 'refIds requis' });

  try {
    await prisma.reference.updateMany({
      where: { id: { in: refIds } },
      data: { sectionId: id },
    });
    res.json({ ok: true, affected: refIds.length });
  } catch (err) {
    console.error('[admin/sections] POST /:id/assign', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/sections/unassign
 * Retire des références de leur section (sectionId → null).
 * Body : { refIds: string[] }
 */
router.post('/unassign', async (req, res) => {
  const { refIds } = req.body;
  if (!Array.isArray(refIds)) return res.status(400).json({ error: 'refIds requis' });

  try {
    await prisma.reference.updateMany({
      where: { id: { in: refIds } },
      data: { sectionId: null },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/admin/sections/suggest
 * Claude analyse toutes les références et propose des sections thématiques.
 * Retourne : { suggestions: [{ title, description, refIds, previewRefs }] }
 *
 * Stratégie indices : Claude travaille avec des indices 0-N (pas des UUIDs)
 * pour réduire drastiquement la taille de la réponse (~10x moins de tokens).
 */
router.post('/suggest', async (_req, res) => {
  try {
    const refs = await prisma.reference.findMany({
      select: {
        id: true,
        title: true,
        channelName: true,
        typeContenu: true,
        mood: true,
        tags: true,
        thumbnailUrl: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (refs.length === 0) {
      return res.json({ suggestions: [] });
    }

    // Format compact avec indices — "42: titre | chaîne | type | mood | tag1,tag2"
    const refList = refs.map((r, i) =>
      `${i}: ${r.title} | ${r.channelName || '—'} | ${r.typeContenu || '?'} | ${r.mood || '?'} | ${(r.tags ?? []).slice(0, 5).join(',')}`
    ).join('\n');

    const systemPrompt = `Tu es un éditeur de contenu pour 180 Degrés, plateforme de veille créative pour vidéastes indépendants français.

On te donne une liste de références vidéo numérotées (format: N: titre | chaîne | type | mood | tags).
Ta mission : proposer 6 à 10 sections thématiques cohérentes pour organiser cette bibliothèque.

Critères pour une bonne section :
- Thème clair et spécifique (pas "Divers" ou "Autres")
- Au moins 5 références par section
- Sections complémentaires, pas redondantes
- Titres courts et évocateurs en français (3-5 mots max)
- Descriptions de 1 phrase expliquant l'angle éditorial

Chaque référence peut apparaître dans plusieurs sections si pertinent.
Utilise uniquement les numéros (entiers) dans refIndices.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Voici ${refs.length} références à organiser :\n\n${refList}\n\nRéponds UNIQUEMENT avec du JSON valide :\n{"sections":[{"title":"...","description":"...","refIndices":[0,1,2,...]}]}`,
      }],
    });

    const text = response.content.find(b => b.type === 'text')?.text ?? '';
    let sections = [];
    try {
      sections = JSON.parse(text).sections ?? [];
    } catch {
      const match = text.match(/\{[\s\S]*"sections"[\s\S]*\}/);
      if (match) sections = JSON.parse(match[0]).sections ?? [];
    }

    if (!sections.length) {
      console.error('[admin/sections] suggest — Claude returned no sections. Raw:', text.slice(0, 500));
      return res.status(500).json({ error: 'Claude n\'a pas retourné de sections valides' });
    }

    // Construire previewRefs (4 thumbnails) pour chaque suggestion
    // Mapper les indices → IDs réels
    const suggestions = sections.map(s => {
      const indices = (s.refIndices ?? []).filter(i => Number.isInteger(i) && i >= 0 && i < refs.length);
      const refIds = indices.map(i => refs[i].id);
      const previewRefs = indices.slice(0, 4).map(i => ({
        id: refs[i].id,
        title: refs[i].title,
        thumbnailUrl: refs[i].thumbnailUrl,
        channelName: refs[i].channelName,
        status: refs[i].status,
      }));
      return { title: s.title, description: s.description, refIds, previewRefs };
    }).filter(s => s.refIds.length >= 3);

    res.json({ suggestions });
  } catch (err) {
    console.error('[admin/sections] POST /suggest', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
