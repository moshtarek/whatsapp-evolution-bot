import dayjs from 'dayjs';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { sendText, sendImage, sendDocument } from './services/evolution.js';
import { generateAIResponse, getAvailableProviders } from './services/ai.js';
import { getAISettings, updateAISettings } from './models/settings.js';
import { parseAIResponse, shouldGenerateImage } from './services/aiResponseParser.js';
import { generateImage, canGenerateImages } from './services/imageGeneration.js';
import { logger } from './utils/logger.js';
import { isBusinessOpen, listRules, createRule, updateRule, deleteRule, getRule } from './models/rules.js';
import { 
  listAuthorizedNumbers, getAuthorizedNumber, createAuthorizedNumber, 
  updateAuthorizedNumber, deleteAuthorizedNumber, isAuthorizedNumber
} from './db.js';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info('Created images directory');
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const uniqueName = `img_${timestamp}_${randomStr}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export const uploadMiddleware = upload.single('image');

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

/** استخراج رقم الجوال من النص إذا بدأ بـ 9665 */
function extractTargetNumber(text) {
  const match = text.match(/9665\d{8}/);
  return match ? match[0] : null;
}

/** مطابقة قاعدة */
function matchRule(input, rule) {
  let msg = (input || '').trim();
  
  // إزالة الرقم من النص للمطابقة
  const cleanMsg = msg.replace(/\s+9665\d{8}\s*$/, '').trim();
  
  switch (rule.match_type) {
    case 'EXACT':       return cleanMsg === rule.pattern ? { ok: true } : { ok: false };
    case 'STARTS_WITH': return cleanMsg.startsWith(rule.pattern) ? { ok: true, tail: cleanMsg.slice(rule.pattern.length) } : { ok: false };
    case 'CONTAINS':    return cleanMsg.includes(rule.pattern) ? { ok: true } : { ok: false };
    case 'REGEX': {
      const re = new RegExp(rule.pattern, 'i'); 
      const m = cleanMsg.match(re);
      return m ? { ok: true, groups: m.slice(1) } : { ok: false };
    }
    default: return { ok: false };
  }
}

/** استبدال متغيرات في الرد */
async function renderReply(template, ctx) {
  let out = template;
  out = out.replace(/\{\{now\}\}/g, dayjs().format('YYYY-MM-DD HH:mm:ss'));
  if (ctx.tail) out = out.replace(/\{\{tail\}\}/g, ctx.tail.trim());
  if (ctx.groups && ctx.groups.length) ctx.groups.forEach((g, i) => { out = out.replace(new RegExp('\\$' + (i + 1), 'g'), g); });
  
  // إضافة دعم {{records}} لعرض جميع السجلات
  if (out.includes('{{records}}')) {
    const rules = await listRules();
    let recordsText = '';
    rules.forEach((rule, index) => {
      recordsText += `${index + 1}. النمط: "${rule.pattern}"\n`;
      recordsText += `   النوع: ${rule.match_type}\n`;
      recordsText += `   الرد: "${rule.reply.substring(0, 50)}${rule.reply.length > 50 ? '...' : ''}"\n`;
      recordsText += `   نشط: ${rule.active ? 'نعم' : 'لا'}\n`;
      recordsText += `   الأولوية: ${rule.priority}\n\n`;
    });
    out = out.replace(/\{\{records\}\}/g, recordsText || 'لا توجد سجلات');
  }
  
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

    // فحص التصريح
    const authorized = await isAuthorizedNumber(number);
    if (!authorized) {
      logger.info('Unauthorized number:', number);
      return res.status(200).json({ ok: false, reason: 'unauthorized number' });
    }

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
        const reply = await renderReply(r.reply, matched);
        
        // تحديد الرقم المستهدف (إما المرسل أو رقم محدد)
        const targetNumber = extractTargetNumber(text) || number;
        const isTargetedMessage = targetNumber !== number;
        
        // إرسال حسب نوع الرد
        if (r.reply_type === 'image' && r.media_url) {
          await sendImage({ number: targetNumber, imageUrl: r.media_url, caption: reply });
        } else if (r.reply_type === 'document' && r.media_url) {
          await sendDocument({ number: targetNumber, documentUrl: r.media_url, filename: r.filename, caption: reply });
        } else if (r.reply_type === 'ai') {
          // معالجة الذكاء الاصطناعي
          await sendText({ number: targetNumber, text: '🤖 جاري التفكير...' });
          
          const userPrompt = matched.tail || matched.full;
          
          // التحقق من طلب إنشاء صورة
          if (shouldGenerateImage(userPrompt)) {
            const canGenerate = await canGenerateImages();
            
            if (canGenerate) {
              await sendText({ number: targetNumber, text: '🎨 جاري إنشاء الصورة...' });
              
              const imageResult = await generateImage(userPrompt);
              
              if (imageResult.success) {
                await sendImage({ 
                  number: targetNumber, 
                  imageUrl: imageResult.imageUrl, 
                  caption: `🎨 تم إنشاء الصورة بنجاح!\n\n📝 الوصف المحسن: ${imageResult.revisedPrompt}` 
                });
              } else {
                await sendText({ number: targetNumber, text: `❌ ${imageResult.error}` });
              }
            } else {
              // استخدام AI عادي للرد على طلب الصورة
              const aiResponse = await generateAIResponse(userPrompt);
              await sendText({ number: targetNumber, text: `🤖 الذكاء الاصطناعي:\n\n${aiResponse}` });
            }
          } else {
            // رد AI عادي
            const aiResponse = await generateAIResponse(userPrompt);
            
            // تحليل الرد للبحث عن صور
            const parsedResponse = parseAIResponse(aiResponse);
            
            if (parsedResponse.hasImages) {
              // إرسال النص أولاً
              await sendText({ number: targetNumber, text: `🤖 الذكاء الاصطناعي:\n\n${parsedResponse.text}` });
              
              // إرسال الصور
              for (const imageUrl of parsedResponse.images) {
                await sendImage({ number: targetNumber, imageUrl: imageUrl, caption: '🖼️ صورة من الذكاء الاصطناعي' });
              }
            } else {
              // رد نصي عادي
              await sendText({ number: targetNumber, text: `🤖 الذكاء الاصطناعي:\n\n${aiResponse}` });
            }
          }
        } else {
          await sendText({ number: targetNumber, text: reply });
        }
        
        // إرسال رسالة تأكيد للمرسل إذا تم الإرسال لرقم آخر
        if (isTargetedMessage) {
          const confirmMsg = `✅ تم إرسال الرسالة للرقم: ${targetNumber}`;
          await sendText({ number, text: confirmMsg });
        }
        
        return res.status(200).json({ ok: true, rule_id: r.id, target_number: targetNumber });
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
  try {
    const result = await createRule(req.body);
    if (result.success) {
      res.json({ id: result.id, message: 'تم إنشاء القاعدة بنجاح' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('Error creating rule:', error);
    res.status(500).json({ error: 'خطأ في إنشاء القاعدة' });
  }
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

// Authorized Numbers handlers
export async function listAuthorizedNumbersHandler(req, res) {
  try {
    const numbers = await listAuthorizedNumbers();
    res.json(numbers);
  } catch (err) {
    logger.error('listAuthorizedNumbersHandler error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getAuthorizedNumberHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const number = await getAuthorizedNumber(id);
    if (!number) return res.status(404).json({ error: 'Number not found' });
    res.json(number);
  } catch (err) {
    logger.error('getAuthorizedNumberHandler error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function createAuthorizedNumberHandler(req, res) {
  try {
    const { phone_number, name, active } = req.body;
    if (!phone_number) return res.status(400).json({ error: 'phone_number is required' });
    
    const cleanNumber = phone_number.replace(/[^0-9]/g, '');
    const number = await createAuthorizedNumber({ phone_number: cleanNumber, name, active });
    res.status(201).json(number);
  } catch (err) {
    logger.error('createAuthorizedNumberHandler error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateAuthorizedNumberHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;
    if (updates.phone_number) {
      updates.phone_number = updates.phone_number.replace(/[^0-9]/g, '');
    }
    const number = await updateAuthorizedNumber(id, updates);
    if (!number) return res.status(404).json({ error: 'Number not found' });
    res.json(number);
  } catch (err) {
    logger.error('updateAuthorizedNumberHandler error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteAuthorizedNumberHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await deleteAuthorizedNumber(id);
    if (!success) return res.status(404).json({ error: 'Number not found' });
    res.json({ ok: true });
  } catch (err) {
    logger.error('deleteAuthorizedNumberHandler error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function uploadImageHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const originalPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const processedFilename = `img_${timestamp}_${randomStr}${ext}`;
    const processedPath = path.join('./images', processedFilename);

    // Process image with sharp to fix orientation, keep original format
    const sharpInstance = sharp(originalPath).rotate();
    
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharpInstance.jpeg({ quality: 85 }).toFile(processedPath);
    } else if (ext === '.png') {
      await sharpInstance.png({ quality: 85 }).toFile(processedPath);
    } else {
      await sharpInstance.toFile(processedPath);
    }

    // Remove original file
    fs.unlinkSync(originalPath);

    logger.info(`Image processed and uploaded: ${processedFilename}`);
    
    res.json({ 
      success: true, 
      filename: processedFilename,
      url: `http://bot.lan/images/${processedFilename}`,
      message: 'Image uploaded and processed successfully'
    });
  } catch (err) {
    logger.error('uploadImageHandler error:', err);
    res.status(500).json({ error: err.message });
  }
}

// إدارة إعدادات الذكاء الاصطناعي
export async function getAISettingsHandler(_req, res) {
  const settings = await getAISettings();
  const providers = getAvailableProviders();
  res.json({ settings, providers });
}

export async function updateAISettingsHandler(req, res) {
  try {
    await updateAISettings(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
