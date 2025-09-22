#!/bin/sh

echo "🚀 Starting WhatsApp Evolution Bot..."

# إنشاء جدول ai_settings إذا لم يكن موجود
echo "📦 Ensuring ai_settings table exists..."
sqlite3 data/bot.db "CREATE TABLE IF NOT EXISTS ai_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  provider TEXT NOT NULL DEFAULT 'groq',
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
  apiKey TEXT DEFAULT '',
  maxTokens INTEGER DEFAULT 1500,
  temperature REAL DEFAULT 0.7,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO ai_settings (id, provider, model, apiKey, maxTokens, temperature)
VALUES (1, 'groq', 'llama-3.1-8b-instant', '', 1500, 0.7);"

# تشغيل migrations إذا كان الملف موجود
if [ -f "db/migrate.js" ]; then
    echo "📦 Running database migrations..."
    node db/migrate.js
else
    echo "⚠️ Migration file not found, skipping..."
fi

# تشغيل التطبيق
echo "✅ Starting application..."
exec node src/index.js
