-- إضافة جدول إعدادات الذكاء الاصطناعي
CREATE TABLE IF NOT EXISTS ai_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'groq',
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
  apiKey TEXT DEFAULT '',
  maxTokens INTEGER DEFAULT 1500,
  temperature REAL DEFAULT 0.7,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- إدراج الإعدادات الافتراضية
INSERT OR IGNORE INTO ai_settings (id, provider, model, apiKey, maxTokens, temperature)
VALUES (1, 'groq', 'llama-3.1-8b-instant', '', 1500, 0.7);
