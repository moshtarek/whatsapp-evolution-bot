import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import {
  onIncoming, health,
  listRulesHandler, getRuleHandler, createRuleHandler, updateRuleHandler, deleteRuleHandler
} from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// خدمة الملفات الثابتة (الواجهة الويب)
app.use(express.static(path.join(__dirname, '../public')));

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

app.listen(config.server.port, () => {
  console.log(`WA Bot listening on :${config.server.port}`);
});
