/**
 * Ingestion Service — orchestrateurs.
 *
 * Ce fichier ne contient que les 3 pipelines exports.
 * La logique YouTube API → lib/youtube.client.js
 * La logique Claude → services/enrichment.service.js
 */

import { prisma } from '../lib/prisma.js';
import { downloadAndStore } from './thumbnail.service.js';
import {
  parseDurationSeconds,
  extractYouTubeId,
  searchYouTube,
  getVideoDetails,
  getChannelAvatars,
  resolveChannelId,
  getUploadsPlaylistId,
  getAllVideoIdsFromPlaylist,
} from '../lib/youtube.client.js';
import {
  enrichVideosBatch,
  generateYouTubeQueries,
  scoreVideosWithClaude,
  SCORE_THRESHOLD,
} from './enrichment.service.js';

// Re-exports pour les tests existants (T-02)
export { parseDurationSeconds, extractYouTubeId };

function readableError(err) {
  const msg = err?.message ?? String(err);
  if (msg.includes('quotaExceeded') || msg.includes('403'))    return 'Quota API YouTube dépassé — réessaie demain.';
  if (msg.includes('ENOTFOUND') || msg.includes('ECONNRESET')) return 'Erreur réseau — vérifie ta connexion et réessaie.';
  if (msg.includes('Anthropic') || msg.includes('claude'))     return 'Erreur Claude API — vérifie ta clé ANTHROPIC_API_KEY.';
  if (msg.includes('Prisma') || msg.includes('P2'))            return 'Erreur base de données — vérifie la connexion Supabase.';
  return `Erreur inattendue : ${msg.slice(0, 120)}`;
}

// ─── Agent Topic Discovery ────────────────────────────────────────────────────

export async function runIngestionAgent(sessionId, brief) {
  const updateSession = (data) =>
    prisma.ingestionSession.update({ where: { id: sessionId }, data }).catch(console.error);

  try {
    const { queries, publishedAfter, minViews } = await generateYouTubeQueries(brief);
    console.log(`[ingestion:${sessionId}] Queries:`, queries);

    const rawResults = [];
    const seenIds = new Set();
    for (const q of queries) {
      try {
        const hits = await searchYouTube(q, publishedAfter, 10);
        for (const hit of hits) {
          if (!seenIds.has(hit.videoId)) { seenIds.add(hit.videoId); rawResults.push(hit); }
        }
      } catch (err) {
        console.warn(`[ingestion:${sessionId}] Query "${q}" failed:`, err.message);
      }
    }

    const details = [];
    for (let i = 0; i < rawResults.length; i += 50) {
      details.push(...await getVideoDetails(rawResults.slice(i, i + 50).map(r => r.videoId)));
    }
    await updateSession({ totalFound: details.length });

    const aboveMinViews = details.filter(v => v.viewCount >= minViews);
    const scored = await scoreVideosWithClaude(brief, aboveMinViews);
    console.log(`[ingestion:${sessionId}] After scoring (>=${SCORE_THRESHOLD}): ${scored.length}/${aboveMinViews.length}`);

    await prisma.ingestionSession.update({ where: { id: sessionId }, data: { totalFiltered: scored.length } });

    const enrichMap = await enrichVideosBatch(scored);
    const avatarMap = await getChannelAvatars(scored.map(v => v.channelId));

    let saved = 0;
    for (const video of scored) {
      try {
        let thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        let thumbnailStorageKey = null, thumbnailSourceUrl = null;
        try {
          const t = await downloadAndStore({ platform: 'youtube', videoId: video.videoId });
          thumbnailUrl = t.thumbnailUrl; thumbnailStorageKey = t.thumbnailStorageKey; thumbnailSourceUrl = t.thumbnailSourceUrl;
        } catch (err) { console.warn(`[ingestion:${sessionId}] Thumbnail failed for ${video.videoId}:`, err.message); }

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const meta = enrichMap[video.videoId] ?? {};
        const shared = {
          thumbnailUrl, thumbnailSourceUrl, thumbnailStorageKey,
          channelAvatarUrl: avatarMap[video.channelId] ?? '',
          tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
          mood: meta.mood ?? null, typeContenu: meta.typeContenu ?? null, context: meta.context ?? '',
          ingestionSessionId: sessionId,
        };
        await prisma.reference.upsert({
          where: { url: videoUrl },
          create: { url: videoUrl, platform: 'YOUTUBE', sourceMode: 'TOPIC_DISCOVERY', status: 'TRIAGE',
            title: video.title, description: video.description ?? '',
            channelName: video.channelName ?? '', channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            ...shared },
          update: { title: video.title, description: video.description ?? '', channelName: video.channelName ?? '', ...shared },
        });
        saved++;
        await updateSession({ totalSaved: saved });
      } catch (err) { console.error(`[ingestion:${sessionId}] Save failed for ${video.videoId}:`, err.message); }
    }

    await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: saved });
    console.log(`[ingestion:${sessionId}] Completed — ${saved} saved`);
  } catch (err) {
    console.error(`[ingestion:${sessionId}] Agent failed:`, err);
    await updateSession({ status: 'FAILED', errorMessage: readableError(err) });
  }
}

// ─── Agent Creator Scan ───────────────────────────────────────────────────────

export async function runCreatorScanAgent(sessionId, creatorIds) {
  const updateSession = (data) =>
    prisma.ingestionSession.update({ where: { id: sessionId }, data }).catch(console.error);

  try {
    const where = creatorIds?.length
      ? { id: { in: creatorIds }, platform: 'YOUTUBE' }
      : { active: true, platform: 'YOUTUBE' };

    const creators = await prisma.creator.findMany({ where, include: { filterRules: { where: { active: true } } } });
    console.log(`[creator-scan:${sessionId}] ${creators.length} creator(s) à scanner`);

    const allVideoIds = [];
    const seenVideoIds = new Set();

    for (const creator of creators) {
      let channelId = creator.channelId;
      if (!channelId) {
        channelId = await resolveChannelId(creator.youtubeHandle || creator.url);
        if (channelId) {
          await prisma.creator.update({ where: { id: creator.id }, data: { channelId } });
          console.log(`[creator-scan:${sessionId}] ${creator.name} → channelId résolu : ${channelId}`);
        } else {
          console.warn(`[creator-scan:${sessionId}] Impossible de résoudre channelId pour ${creator.name}`);
          continue;
        }
      }

      const playlistId = await getUploadsPlaylistId(channelId);
      if (!playlistId) { console.warn(`[creator-scan:${sessionId}] Pas de playlist uploads pour ${creator.name}`); continue; }

      const videoIds = await getAllVideoIdsFromPlaylist(playlistId);
      console.log(`[creator-scan:${sessionId}] ${creator.name} → ${videoIds.length} vidéos`);
      for (const vid of videoIds) { if (!seenVideoIds.has(vid)) { seenVideoIds.add(vid); allVideoIds.push(vid); } }
    }

    await updateSession({ totalFound: allVideoIds.length });

    const allDetails = [];
    for (let i = 0; i < allVideoIds.length; i += 50) {
      allDetails.push(...await getVideoDetails(allVideoIds.slice(i, i + 50)));
    }

    const aboveDuration = allDetails.filter(v => v.durationSeconds > 180);
    const totalFilteredByDuration = allDetails.length - aboveDuration.length;
    console.log(`[creator-scan:${sessionId}] Après filtre > 3 min : ${aboveDuration.length}/${allDetails.length}`);

    const channelRulesMap = {};
    for (const creator of creators) {
      if (creator.channelId && creator.filterRules?.length) channelRulesMap[creator.channelId] = creator.filterRules;
    }
    const enriched = aboveDuration.filter(v => {
      const rules = channelRulesMap[v.channelId] ?? [];
      return rules.every(rule => {
        const haystack = rule.type === 'channel_name' ? (v.channelName ?? '').toLowerCase() : (v.title ?? '').toLowerCase();
        return !haystack.includes(rule.pattern);
      });
    });
    const totalFilteredByRules = aboveDuration.length - enriched.length;
    if (totalFilteredByRules > 0) console.log(`[creator-scan:${sessionId}] Après FilterRules : ${enriched.length}/${aboveDuration.length}`);

    await updateSession({ totalFilteredByDuration, totalFilteredByRules });

    const enrichMap = await enrichVideosBatch(enriched);
    const avatarMap = await getChannelAvatars(enriched.map(v => v.channelId));

    let saved = 0;
    for (const video of enriched) {
      try {
        let thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        let thumbnailStorageKey = null, thumbnailSourceUrl = null;
        try {
          const t = await downloadAndStore({ platform: 'youtube', videoId: video.videoId });
          thumbnailUrl = t.thumbnailUrl; thumbnailStorageKey = t.thumbnailStorageKey; thumbnailSourceUrl = t.thumbnailSourceUrl;
        } catch (err) { console.warn(`[creator-scan:${sessionId}] Thumbnail failed for ${video.videoId}:`, err.message); }

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const meta = enrichMap[video.videoId] ?? {};
        const shared = {
          thumbnailUrl, thumbnailSourceUrl, thumbnailStorageKey,
          channelAvatarUrl: avatarMap[video.channelId] ?? '',
          tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
          mood: meta.mood ?? null, typeContenu: meta.typeContenu ?? null, context: meta.context ?? '',
          ingestionSessionId: sessionId,
        };
        await prisma.reference.upsert({
          where: { url: videoUrl },
          create: { url: videoUrl, platform: 'YOUTUBE', sourceMode: 'CREATOR_SCAN', status: 'TRIAGE',
            title: video.title, description: video.description ?? '',
            channelName: video.channelName ?? '', channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            ...shared },
          update: { title: video.title, description: video.description ?? '', channelAvatarUrl: avatarMap[video.channelId] ?? '', ...shared },
        });
        saved++;
        await updateSession({ totalSaved: saved });
      } catch (err) { console.error(`[creator-scan:${sessionId}] Save failed for ${video.videoId}:`, err.message); }
    }

    const totalAlreadyPublished = await prisma.reference.count({ where: { ingestionSessionId: sessionId, status: 'PUBLISHED' } });
    await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: saved, totalAlreadyPublished });
    console.log(`[creator-scan:${sessionId}] Completed — ${saved}/${enriched.length} saved`);
  } catch (err) {
    console.error(`[creator-scan:${sessionId}] Agent failed:`, err);
    await updateSession({ status: 'FAILED', errorMessage: readableError(err) });
  }
}

// ─── Agent Liens manuels ──────────────────────────────────────────────────────

export async function fetchAndSaveLinks(sessionId, urls) {
  const updateSession = (data) =>
    prisma.ingestionSession.update({ where: { id: sessionId }, data }).catch(console.error);

  try {
    const videoIds = [...new Set(urls.map(extractYouTubeId).filter(Boolean))];
    console.log(`[links:${sessionId}] ${videoIds.length} videoIds valides sur ${urls.length} URLs`);
    await updateSession({ totalFound: videoIds.length });

    if (!videoIds.length) { await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: 0 }); return; }

    const details = [];
    for (let i = 0; i < videoIds.length; i += 50) details.push(...await getVideoDetails(videoIds.slice(i, i + 50)));

    const enrichMap = await enrichVideosBatch(details);
    const avatarMap = await getChannelAvatars(details.map(v => v.channelId));

    let saved = 0;
    for (const video of details) {
      try {
        let thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        let thumbnailStorageKey = null, thumbnailSourceUrl = null;
        try {
          const t = await downloadAndStore({ platform: 'youtube', videoId: video.videoId });
          thumbnailUrl = t.thumbnailUrl; thumbnailStorageKey = t.thumbnailStorageKey; thumbnailSourceUrl = t.thumbnailSourceUrl;
        } catch (err) { console.warn(`[creator-scan:${sessionId}] Thumbnail failed for ${video.videoId}:`, err.message); }

        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
        const meta = enrichMap[video.videoId] ?? {};
        const shared = {
          thumbnailUrl, thumbnailSourceUrl, thumbnailStorageKey,
          channelAvatarUrl: avatarMap[video.channelId] ?? '',
          tags: meta.tags?.length ? meta.tags : (video.tags ?? []),
          mood: meta.mood ?? null, typeContenu: meta.typeContenu ?? null, context: meta.context ?? '',
          ingestionSessionId: sessionId,
        };
        await prisma.reference.upsert({
          where: { url: videoUrl },
          create: { url: videoUrl, platform: 'YOUTUBE', sourceMode: 'MANUAL', status: 'TRIAGE',
            title: video.title, description: video.description ?? '',
            channelName: video.channelName ?? '', channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            ...shared },
          update: { title: video.title, description: video.description ?? '', channelAvatarUrl: avatarMap[video.channelId] ?? '', ...shared },
        });
        saved++;
        await updateSession({ totalSaved: saved });
      } catch (err) { console.error(`[links:${sessionId}] Save failed for ${video.videoId}:`, err.message); }
    }

    await updateSession({ status: 'COMPLETED', completedAt: new Date(), totalSaved: saved });
    console.log(`[links:${sessionId}] Completed — ${saved}/${details.length} saved`);
  } catch (err) {
    console.error(`[links:${sessionId}] Agent failed:`, err);
    await updateSession({ status: 'FAILED', errorMessage: readableError(err) });
  }
}
