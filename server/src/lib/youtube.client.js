/**
 * YouTube Data API v3 — client pur.
 * Toutes les fonctions sont stateless et ne dépendent que de YT_KEY.
 * Aucun accès Prisma, aucun appel Claude ici.
 */

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const YT_KEY  = process.env.YOUTUBE_API_KEY;

export function parseDurationSeconds(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? 0) * 3600) + (parseInt(m[2] ?? 0) * 60) + parseInt(m[3] ?? 0);
}

export function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m?.[1] ?? null;
}

export async function searchYouTube(query, publishedAfter, maxResults = 10) {
  const url = new URL(`${YT_BASE}/search`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('videoDuration', 'medium');
  url.searchParams.set('videoDefinition', 'high');
  url.searchParams.set('order', 'viewCount');
  if (publishedAfter) url.searchParams.set('publishedAfter', publishedAfter);
  url.searchParams.set('key', YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search.list error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return (data.items ?? []).map(item => ({
    videoId:     item.id.videoId,
    title:       item.snippet.title,
    description: item.snippet.description,
    channelId:   item.snippet.channelId,
    channelName: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }));
}

export async function getVideoDetails(videoIds) {
  if (!videoIds.length) return [];
  const url = new URL(`${YT_BASE}/videos`);
  url.searchParams.set('part', 'snippet,statistics,contentDetails');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube videos.list error ${res.status}`);
  const data = await res.json();

  return (data.items ?? []).map(item => ({
    videoId:         item.id,
    title:           item.snippet.title,
    description:     item.snippet.description,
    channelId:       item.snippet.channelId,
    channelName:     item.snippet.channelTitle,
    publishedAt:     item.snippet.publishedAt,
    tags:            item.snippet.tags ?? [],
    viewCount:       parseInt(item.statistics?.viewCount ?? '0', 10),
    durationSeconds: parseDurationSeconds(item.contentDetails?.duration),
  }));
}

export async function getChannelAvatars(channelIds) {
  const unique = [...new Set(channelIds)].filter(Boolean);
  if (!unique.length) return {};

  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('id', unique.join(','));
  url.searchParams.set('key', YT_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) return {};
  const data = await res.json();

  const map = {};
  for (const item of data.items ?? []) {
    map[item.id] = item.snippet?.thumbnails?.default?.url ?? '';
  }
  return map;
}

export async function resolveChannelId(input) {
  if (!input) return null;

  const channelMatch = input.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (channelMatch) return channelMatch[1];

  const handleMatch = input.match(/(?:youtube\.com\/)?@([\w.-]+)/);
  if (handleMatch) {
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set('part', 'id');
    url.searchParams.set('forHandle', handleMatch[1]);
    url.searchParams.set('key', YT_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id ?? null;
  }

  const legacyMatch = input.match(/youtube\.com\/c\/([\w.-]+)/);
  if (legacyMatch) {
    const url = new URL(`${YT_BASE}/channels`);
    url.searchParams.set('part', 'id');
    url.searchParams.set('forUsername', legacyMatch[1]);
    url.searchParams.set('key', YT_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id ?? null;
  }

  return null;
}

export async function getUploadsPlaylistId(channelId) {
  const url = new URL(`${YT_BASE}/channels`);
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', YT_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

// 1 quota unit/call vs 100 pour search.list
export async function getAllVideoIdsFromPlaylist(playlistId) {
  const items = [];
  let pageToken = null;

  do {
    const url = new URL(`${YT_BASE}/playlistItems`);
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', YT_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) break;
    const data = await res.json();

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (videoId) items.push(videoId);
    }
    pageToken = data.nextPageToken ?? null;
  } while (pageToken);

  return items;
}
