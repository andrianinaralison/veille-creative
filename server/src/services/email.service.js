/**
 * Email Service — rendu HTML du digest + envoi via Resend (180-20).
 * Le client Resend est instancié paresseusement : sans RESEND_API_KEY,
 * le rendu fonctionne mais l'envoi échoue avec un message lisible.
 */

import { Resend } from 'resend';

let resendClient = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    const err = new Error('RESEND_API_KEY manquante — configure la clé dans server/.env');
    err.status = 503;
    throw err;
  }
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function weekLabel(weekOf) {
  return new Date(weekOf).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * HTML responsive dark cinema — tables + styles inline (clients mail).
 */
export function renderDigestHtml(digest, { appUrl = process.env.FRONTEND_URL || 'http://localhost:5173' } = {}) {
  const itemsHtml = digest.items.map((item, idx) => {
    const ref = item.reference;
    const note = item.note || ref.context || '';
    const tags = (ref.taxonomy ?? []).slice(0, 3).map(t =>
      `<span style="font-family:monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a8a8a;border:1px solid #2e2e2e;padding:2px 6px;margin-right:4px;">${esc(t)}</span>`
    ).join('');

    return `
      <tr><td style="padding:28px 0 0 0;">
        <a href="${esc(ref.url)}" style="text-decoration:none;">
          <img src="${esc(ref.thumbnailUrl)}" alt="${esc(ref.title)}" width="100%" style="display:block;width:100%;max-width:600px;border:0;" />
        </a>
        <p style="font-family:monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6f6f6f;margin:14px 0 4px;">
          ${String(idx + 1).padStart(2, '0')} · ${esc(ref.channelName)}
        </p>
        <h2 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;color:#f2f2f2;margin:0 0 8px;">
          <a href="${esc(ref.url)}" style="color:#f2f2f2;text-decoration:none;">${esc(ref.title)}</a>
        </h2>
        ${note ? `<p style="font-family:Georgia,serif;font-style:italic;font-size:14px;line-height:1.55;color:#b5b5b5;margin:0 0 10px;">« ${esc(note)} »</p>` : ''}
        <p style="margin:0;">${tags}</p>
      </td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(digest.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="padding-bottom:28px;border-bottom:1px solid #2e2e2e;">
          <span style="font-family:Helvetica,Arial,sans-serif;font-weight:bold;font-size:14px;color:#f2f2f2;">180Degré</span>
          <span style="font-family:monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#6f6f6f;"> · digest · semaine du ${weekLabel(digest.weekOf)}</span>
        </td></tr>

        <tr><td style="padding:36px 0 0 0;">
          <h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;color:#f2f2f2;margin:0 0 14px;">${esc(digest.title)}</h1>
          ${digest.intro ? `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#b5b5b5;margin:0;">${esc(digest.intro)}</p>` : ''}
        </td></tr>

        ${itemsHtml}

        <tr><td style="padding:40px 0 0 0;">
          <a href="${esc(appUrl)}/digest" style="display:inline-block;font-family:monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#0d0d0d;background-color:#f2f2f2;padding:12px 22px;text-decoration:none;">Lire dans l'app</a>
        </td></tr>

        <tr><td style="padding:36px 0 12px;border-top:1px solid #2e2e2e;margin-top:36px;">
          <p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#6f6f6f;margin:24px 0 0;">
            Tu reçois ce digest parce que tu es abonné·e à la veille 180Degré.<br/>
            <a href="${esc(appUrl)}/settings" style="color:#8a8a8a;">Gérer mes préférences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Envoie le digest aux destinataires (batch Resend, 100 max par appel).
 * Retourne { sent, failed }.
 */
export async function sendDigestEmail(digest, recipients) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || '180Degré <digest@updates.180degre.com>';
  const html = renderDigestHtml(digest);
  const subject = `Digest — ${digest.title}`;

  let sent = 0;
  const failed = [];

  const BATCH = 100;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const { data, error } = await resend.batch.send(
      batch.map(u => ({ from, to: u.email, subject, html }))
    );
    if (error) {
      failed.push(...batch.map(u => u.email));
      console.error('[email] batch send failed:', error);
    } else {
      sent += data?.data?.length ?? batch.length;
    }
  }

  return { sent, failed };
}
