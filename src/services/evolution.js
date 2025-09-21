import axios from 'axios';
import https from 'https';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const insecure = process.env.EVOLUTION_TLS_INSECURE === '1';
const httpsAgent = insecure ? new https.Agent({ rejectUnauthorized: false, minVersion: 'TLSv1.2' }) : undefined;

const api = axios.create({
  baseURL: config.evolution.baseURL,
  timeout: 15000,
  httpsAgent
});

/**
 * بعض تركيب Evolution المختلفة تتوقع:
 *  (C) { number, text }
 *  (A) { number, message: { text } }
 *  (B) { number, textMessage: { text } }
 *  (D) { remoteJid, text }
 * سنجرّبها بالترتيب: C -> A -> B -> D
 *
 * ملاحظة: إن احتاج النظام jid بدل أرقام، فعّل:
 *   EVOLUTION_NUMBER_FORMAT=jid
 * في .env
 */
function formatNumber(num) {
  const fmt = process.env.EVOLUTION_NUMBER_FORMAT || 'digits'; // digits | jid
  const digits = String(num).replace(/[^0-9]/g, '');
  return fmt === 'jid' ? `${digits}@s.whatsapp.net` : digits;
}

async function postSendText(payload) {
  const url = `/message/sendText/${encodeURIComponent(config.evolution.instance)}`;
  return api.post(url, payload, {
    headers: { 'apikey': config.evolution.apiKey, 'Content-Type': 'application/json' }
  });
}

export async function sendText({ number, text }) {
  if (!number) throw new Error('sendText: number is required');
  const nDigits = String(number).replace(/[^0-9]/g, '');
  const nJid = `${nDigits}@s.whatsapp.net`;
  const n = formatNumber(number);

  const candidates = [
    { tag: 'C_top_level_text_number', payload: { number: n, text } },
    { tag: 'A_message_text',          payload: { number: n, message: { text } } },
    { tag: 'B_textMessage_text',      payload: { number: n, textMessage: { text } } },
    { tag: 'D_top_level_text_remoteJid', payload: { remoteJid: nJid, text } },
  ];

  let lastErr = null;
  for (const c of candidates) {
    try {
      const res = await postSendText(c.payload);
      logger.info(`Sent text (${c.tag}) ->`, JSON.stringify(c.payload), JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      logger.error(`sendText (${c.tag}) error:`, status, data ? JSON.stringify(data) : err.message);
      lastErr = err;
      // جرّب التالية فقط إن كان 400/422 (فاليديشن). غير ذلك، أوقف.
      if (status && ![400, 422].includes(status)) break;
    }
  }
  throw lastErr || new Error('All payload variants failed');
}

async function postSendMedia(payload, endpoint) {
  const url = `/message/${endpoint}/${encodeURIComponent(config.evolution.instance)}`;
  return api.post(url, payload, {
    headers: { 'apikey': config.evolution.apiKey, 'Content-Type': 'application/json' }
  });
}

export async function sendImage({ number, imageUrl, caption = '' }) {
  if (!number || !imageUrl) throw new Error('sendImage: number and imageUrl are required');
  const n = formatNumber(number);
  const nJid = `${String(number).replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  const candidates = [
    { tag: 'sendMedia', payload: { number: n, mediatype: 'image', media: imageUrl, caption } },
    { tag: 'sendMedia_jid', payload: { remoteJid: nJid, mediatype: 'image', media: imageUrl, caption } },
    { tag: 'sendText_with_image', payload: { number: n, text: `${caption}\n\n🖼️ ${imageUrl}` } },
  ];

  let lastErr = null;
  for (const c of candidates) {
    try {
      const endpoint = c.tag.includes('sendText') ? 'sendText' : 'sendMedia';
      const res = await postSendMedia(c.payload, endpoint);
      logger.info(`Sent image (${c.tag}) ->`, JSON.stringify(c.payload));
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      logger.error(`sendImage (${c.tag}) error:`, status, err.response?.data || err.message);
      lastErr = err;
      if (status && ![400, 422, 404].includes(status)) break;
    }
  }
  throw lastErr || new Error('All image payload variants failed');
}

export async function sendDocument({ number, documentUrl, filename, caption = '' }) {
  if (!number || !documentUrl) throw new Error('sendDocument: number and documentUrl are required');
  const n = formatNumber(number);
  const nJid = `${String(number).replace(/[^0-9]/g, '')}@s.whatsapp.net`;

  const candidates = [
    { tag: 'sendMedia', payload: { number: n, mediatype: 'document', media: documentUrl, fileName: filename, caption } },
    { tag: 'sendDocument', payload: { number: n, document: documentUrl, fileName: filename, caption } },
    { tag: 'sendMedia_jid', payload: { remoteJid: nJid, mediatype: 'document', media: documentUrl, fileName: filename, caption } },
  ];

  let lastErr = null;
  for (const c of candidates) {
    try {
      const res = await postSendMedia(c.payload, c.tag === 'sendDocument' ? 'sendDocument' : 'sendMedia');
      logger.info(`Sent document (${c.tag}) ->`, JSON.stringify(c.payload));
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      logger.error(`sendDocument (${c.tag}) error:`, status, err.response?.data || err.message);
      lastErr = err;
      if (status && ![400, 422].includes(status)) break;
    }
  }
  throw lastErr || new Error('All document payload variants failed');
}
