#!/bin/sh

echo "🚀 Starting WhatsApp Evolution Bot..."

# تشغيل migrations تلقائياً
echo "📦 Running database migrations..."
node db/migrate.js

# تشغيل التطبيق
echo "✅ Starting application..."
exec node src/index.js
