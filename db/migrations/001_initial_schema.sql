-- إنشاء الجداول الأساسية
CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'EXACT',
  reply TEXT NOT NULL,
  reply_type TEXT DEFAULT 'text',
  media_url TEXT,
  filename TEXT,
  lang TEXT DEFAULT 'ar',
  active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 10,
  only_in_business_hours INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS authorized_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT UNIQUE NOT NULL,
  executed_at TEXT DEFAULT (datetime('now'))
);
