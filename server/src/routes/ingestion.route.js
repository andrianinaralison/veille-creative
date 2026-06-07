/**
 * Ingestion Routes — 180 Degrés
 *
 * POST /api/v1/ingestion/sessions  → lance l'agent en background, retourne { sessionId }
 * GET  /api/v1/ingestion/sessions  → liste les sessions (les plus récentes en premier)
 * GET  /api/v1/ingestion/sessions/:id → status + références trouvées (pour polling)
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  runIngestionAgent,
  runCreatorScanAgent,
  fetchAndSaveLinks,
} from '../services/ingestion.service.js';

const router = Router();

/**
 * POST /api/v1/ingestion/sessions
 * Body : { brief: string }
 * Crée la session, lance l'agent en arrière-plan, retourne { sessionId } immédiatement.
 */
router.post('/sessions', async (req, res) => {
  const { brief } = req.body;
  if (!brief?.trim()) {
    return res.status(400).json({ error: 'brief requis' });
  }

  try {
    const session = await prisma.ingestionSession.create({
      data: {
        mode: 'TOPIC_DISCOVERY',
        status: 'RUNNING',
        brief: brief.trim(),
      },
    });

    // Fire-and-forget — l'agent tourne en arrière-plan
    runIngestionAgent(session.id, brief.trim()).catch(err => {
      console.error('[ingestion] Unhandled agent error:', err);
    });

    res.status(201).json({ sessionId: session.id });
  } catch (err) {
    console.error('[ingestion] POST /sessions', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/v1/ingestion/sessions
 * Liste les sessions (20 dernières), sans les références.
 */
router.get('/sessions', async (req, res) => {
  const { status } = req.query;
  try {
    const sessions = await prisma.ingestionSession.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ sessions });
  } catch (err) {
    console.error('[ingestion] GET /sessions', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/v1/ingestion/sessions/:id
 * Retourne la session + toutes ses références (pour polling frontend).
 */
router.get('/sessions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.ingestionSession.findUnique({
      where: { id },
      include: {
        references: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            url: true,
            platform: true,
            title: true,
            description: true,
            channelName: true,
            channelUrl: true,
            channelAvatarUrl: true,
            thumbnailUrl: true,
            tags: true,
            mood: true,
            typeContenu: true,
            context: true,
            status: true,
            sectionId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable' });
    }

    res.json(session);
  } catch (err) {
    console.error('[ingestion] GET /sessions/:id', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/ingestion/creator-scan
 * Body : { creatorIds?: string[] }  — si vide, scanne tous les créateurs actifs YOUTUBE
 */
router.post('/creator-scan', async (req, res) => {
  const { creatorIds } = req.body;

  try {
    const session = await prisma.ingestionSession.create({
      data: {
        mode: 'CREATOR_SCAN',
        status: 'RUNNING',
        brief: creatorIds?.length
          ? `Scan de ${creatorIds.length} créateur(s) sélectionné(s)`
          : 'Scan de tous les créateurs actifs',
      },
    });

    runCreatorScanAgent(session.id, creatorIds ?? null).catch(err => {
      console.error('[ingestion] Unhandled creator-scan error:', err);
    });

    res.status(201).json({ sessionId: session.id });
  } catch (err) {
    console.error('[ingestion] POST /creator-scan', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/ingestion/links
 * Body : { urls: string[] }  — liste d'URLs YouTube
 */
router.post('/links', async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls requis (tableau non vide)' });
  }

  try {
    const session = await prisma.ingestionSession.create({
      data: {
        mode: 'MANUAL',
        status: 'RUNNING',
        brief: `Import manuel de ${urls.length} lien(s)`,
      },
    });

    fetchAndSaveLinks(session.id, urls).catch(err => {
      console.error('[ingestion] Unhandled links error:', err);
    });

    res.status(201).json({ sessionId: session.id });
  } catch (err) {
    console.error('[ingestion] POST /links', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/v1/ingestion/sessions/:id/conflicts/resolve
 * Résout un conflit de doublon pour une session.
 * Body : { videoId: string, action: 'overwrite' | 'skip' | 'attach' }
 *   overwrite → écrase les données enrichies de la référence existante (préserve status/curation)
 *   skip      → ignore, la référence existante reste intacte
 *   attach    → rattache la référence existante à cette session (mise à jour ingestionSessionId)
 */
router.post('/sessions/:id/conflicts/resolve', async (req, res) => {
  const { id } = req.params;
  const { videoId, action } = req.body ?? {};

  if (!videoId || !['overwrite', 'skip', 'attach'].includes(action)) {
    return res.status(400).json({ error: 'videoId et action (overwrite|skip|attach) requis' });
  }

  try {
    const session = await prisma.ingestionSession.findUnique({ where: { id }, select: { conflicts: true } });
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const conflicts = Array.isArray(session.conflicts) ? session.conflicts : [];
    const conflict = conflicts.find(c => c.videoId === videoId);
    if (!conflict) return res.status(404).json({ error: 'Conflit introuvable pour ce videoId' });

    if (action === 'overwrite') {
      const { ingestionSessionId: _sid, ...enrichFields } = conflict.newData;
      await prisma.reference.update({
        where: { id: conflict.existingId },
        data: { ...enrichFields, ingestionSessionId: id },
      });
    } else if (action === 'attach') {
      await prisma.reference.update({
        where: { id: conflict.existingId },
        data: { ingestionSessionId: id },
      });
    }
    // skip : rien à faire en base

    const remaining = conflicts.filter(c => c.videoId !== videoId);
    await prisma.ingestionSession.update({
      where: { id },
      data: { conflicts: remaining, totalConflicts: remaining.length },
    });

    res.json({ ok: true, remaining: remaining.length });
  } catch (err) {
    console.error('[ingestion] POST /sessions/:id/conflicts/resolve', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
