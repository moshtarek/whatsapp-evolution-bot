import dayjs from 'dayjs';
import { sendText } from './services/evolution.js';
import { logger } from './utils/logger.js';
import { isBusinessOpen, listRules, createRule, updateRule, deleteRule, getRule } from './models/rules.js'; // <- سنضيف models أدناه

/** استخراج الرقم والنص من Payload Evolution (يدعم data{} وبدونه) */
function parseIncoming(body) {
  const root = body?.data ?? body;
  const key = root?.key || {};

  let number = key.remoteJid || root?.remoteJid || '';
  number = String(number).replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9]/g, '');

  const m = root?.message || {};
  let text = '';
  if (typeof m.conversation === 'string') text = m.conversation;
  else if (m?.extendedTextMessage?.text) text = m.extendedTextMessage.text;
  else if (m?.imageMessage?.caption) text = m.imageMessage.caption;
  else if (m?.documentMessage?.caption) text = m.documentMessage.caption;

  return { number, text, fromMe: Boolean(key.fromMe), msgId: key.id || '', pushName: root?.pushName || body?.pushName || '' };
}

/** مطابقة قاعدة */
function matchRule(input, rule) {
  const msg = (input || '').trim();
  switch (rule.match_type) {
    case 'EXACT':       return msg === rule.pattern ? { ok: true } : { ok: false };
    case 'STARTS_WITH': return msg.startsWith(rule.pattern) ? { ok: true, tail: msg.slice(rule.pattern.length) } : { ok: false };
    case 'CONTAINS':    return msg.includes(rule.pattern) ? { ok: true } : { ok: false };
    case 'REGEX': {
      const re = new RegExp(rule.pattern, 'i'); const m = msg.match(re);
      return m ? { ok: true, groups: m.slice(1) } : { ok: false };
    }
    default: return { ok: false };
  }
}

/** استبدال متغيرات في الرد */
function renderReply(template, ctx) {
  let out = template;
  out = out.replace(/\{\{now\}\}/g, dayjs().format('YYYY-MM-DD HH:mm:ss'));
  if (ctx.tail) out = out.replace(/\{\{tail\}\}/g, ctx.tail.trim());
  if (ctx.groups && ctx.groups.length) ctx.groups.forEach((g, i) => { out = out.replace(new RegExp('\\$' + (i + 1), 'g'), g); });
  return out;
}

export async function onIncoming(req, res) {
  try {
    // طبّع body إلى JSON (يدعم JSON/urlencoded/plain + nested payload/data كنص)
    let raw = req.body;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch {} }
    if (raw && typeof raw === 'object') {
      if (typeof raw.payload === 'string') { try { raw = JSON.parse(raw.payload); } catch {} }
      else if (typeof raw.data === 'string') { try { raw = JSON.parse(raw.data); } catch {} }
    }
    const payload = raw || {};

    const ev = (payload?.event || '').toLowerCase();
    if (ev && ev !== 'messages_upsert' && ev !== 'messages.upsert') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const { number, text, fromMe } = parseIncoming(payload);
    logger.info('Incoming:', { number, text });

    const expected = process.env.WEBHOOK_SECRET;
    if (expected && req.headers['x-webhook-secret'] !== expected) {
      return res.status(401).json({ ok: false });
    }

    const ignoreFromMe = (process.env.IGNORE_FROM_ME ?? '1') === '1';
    if (fromMe && ignoreFromMe) {
      logger.info('Skipped message because fromMe=true and IGNORE_FROM_ME=1');
      return res.status(200).json({ ok: true, skipped: 'fromMe' });
    }

    if (!number || !text) {
      logger.warn('Invalid payload (missing number/text)');
      return res.status(200).json({ ok: true });
    }

    // قواعد DB
    const open = isBusinessOpen();
    const rules = await listRules();
    const candidates = rules
      .filter(r => r.active === 1)
      .sort((a, b) => (a.priority - b.priority) || (a.id - b.id));

    for (const r of candidates) {
      if (r.only_in_business_hours && !open) continue;
      const matched = matchRule(text, r);
      if (matched.ok) {
        const reply = renderReply(r.reply, matched);
        await sendText({ number, text: reply });
        return res.status(200).json({ ok: true, rule_id: r.id });
      }
    }

    // رد افتراضي
    await sendText({
      number,
      text:
`تم استلام رسالتك:
"${text}"

💡 اكتب #help لعرض الأوامر أو استخدم الكلمات المفتاحية حسب القواعد.`
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error('onIncoming error:', err.message);
    return res.status(200).json({ ok: true });
  }
}

/** صحة */
export async function health(_req, res) {
  res.json({ ok: true, ts: new Date().toISOString() });
}

/** REST لإدارة القواعد */
export async function listRulesHandler(_req, res) {
  const rules = await listRules();
  res.json(rules);
}
export async function getRuleHandler(req, res) {
  const row = await getRule(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
}
export async function createRuleHandler(req, res) {
  const id = await createRule(req.body);
  res.json({ id });
}
export async function updateRuleHandler(req, res) {
  const id = Number(req.params.id);
  const updatedId = await updateRule(id, req.body);
  if (!updatedId) return res.status(404).json({ error: 'not found' });
  res.json({ id: updatedId });
}
export async function deleteRuleHandler(req, res) {
  const id = Number(req.params.id);
  await deleteRule(id);
  res.json({ ok: true });
}
