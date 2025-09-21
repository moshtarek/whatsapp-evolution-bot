import express from 'express';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import {
  onIncoming, health,
  listRulesHandler, getRuleHandler, createRuleHandler, updateRuleHandler, deleteRuleHandler,
  listAuthorizedNumbersHandler, getAuthorizedNumberHandler, createAuthorizedNumberHandler, 
  updateAuthorizedNumberHandler, deleteAuthorizedNumberHandler,
  uploadImageHandler, uploadMiddleware
} from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// إنشاء مجلد images إذا لم يكن موجوداً
const imagesDir = path.join(__dirname, '../images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ Created images directory');
}

// خدمة الملفات الثابتة (الواجهة الويب)
app.use(express.static(path.join(__dirname, '../public')));

// خدمة الصور المرفوعة
app.use('/images', express.static(path.join(__dirname, '../images')));

// JSON / x-www-form-urlencoded / نص خام
app.use((req, res, next) => {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) return express.json({ limit: '1mb' })(req, res, next);
  if (ct.includes('application/x-www-form-urlencoded')) return express.urlencoded({ extended: true, limit: '1mb' })(req, res, next);
  return express.text({ type: '*/*', limit: '1mb' })(req, res, next);
});

app.use(morgan('tiny'));

// DEBUG 
app.use((req, _res, next) => {
  const short = typeof req.body === 'string' ? req.body.slice(0, 500) : req.body;
  console.log('[DEBUG] CT=', req.headers['content-type'], 'BODY=', short);
  next();
});

app.get('/health', health);

// يلتقط /webhook وأي مسار تحته
app.post(/^\/webhook(\/.*)?$/, onIncoming);

// CRUD للقواعد
app.get('/rules', listRulesHandler);
app.get('/rules/:id', getRuleHandler);
app.post('/rules', createRuleHandler);
app.put('/rules/:id', updateRuleHandler);
app.delete('/rules/:id', deleteRuleHandler);

// CRUD للأرقام المصرحة
app.get('/authorized-numbers', listAuthorizedNumbersHandler);
app.get('/authorized-numbers/:id', getAuthorizedNumberHandler);
app.post('/authorized-numbers', createAuthorizedNumberHandler);
app.put('/authorized-numbers/:id', updateAuthorizedNumberHandler);
app.delete('/authorized-numbers/:id', deleteAuthorizedNumberHandler);

// رفع الصور
app.post('/upload-image', uploadMiddleware, uploadImageHandler);

app.listen(config.server.port, config.server.host, () => {
  const host = config.server.host === '0.0.0.0' ? 'all networks' : config.server.host;
  console.log(`WA Bot listening on ${host}:${config.server.port}`);
});
