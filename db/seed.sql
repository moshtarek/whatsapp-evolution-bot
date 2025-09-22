-- بيانات أولية للبوت

-- قاعدة المساعدة
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('#help', 'EXACT', 'الأوامر:
- #help
- ping
- الوقت
- echo <نص>
- gmail (للوصول لموقع Gmail)
- hotmail أو outlook (للوصول لموقع Outlook)
- سجلات (لعرض جميع السجلات)
- بيتي (صورة المنزل مع الإحداثيات)
- إرسال <رقم> <رسالة>', 'text', 1, 1, 'ar');

-- قاعدة الذكاء الاصطناعي الجديدة
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('ذكي', 'STARTS_WITH', 'AI_RESPONSE', 'ai', 1, 1, 'ar');

-- قاعدة الذكاء الاصطناعي القديمة (REGEX)
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('^ذكي\\s+(.+)$', 'REGEX', 'هذا سؤال ذكي: $1', 'text', 1, 1, 'ar');

-- صورة المنزل
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, media_url, active, priority, lang) VALUES
('بيتي', 'EXACT', 'هذا منزلي 🏠', 'image', 'https://maps.googleapis.com/maps/api/staticmap?center=24.7136,46.6753&zoom=15&size=600x400&maptype=satellite&markers=color:red%7C24.7136,46.6753&key=YOUR_API_KEY', 1, 3, 'ar');

-- معلومات الطقس
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('^طقس\\s+(.+)$', 'REGEX', 'معلومات الطقس لـ $1 غير متوفرة حالياً', 'text', 1, 6, 'ar');

-- أوامر أساسية
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('^echo\\s+(.+)$', 'REGEX', '$1', 'text', 1, 10, 'ar'),
('gmail', 'EXACT', 'https://mail.google.com', 'text', 1, 10, 'ar'),
('hotmail', 'EXACT', 'https://outlook.live.com', 'text', 1, 10, 'ar'),
('outlook', 'EXACT', 'https://outlook.live.com', 'text', 1, 10, 'ar'),
('ping', 'EXACT', 'pong! البوت يعمل بشكل طبيعي ✅', 'text', 1, 10, 'ar'),
('الوقت', 'EXACT', 'الوقت الحالي: {{now}}', 'text', 1, 10, 'ar');

-- صور إضافية
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, media_url, active, priority, lang) VALUES
('بيت الوالد', 'EXACT', 'بيت الوالد 🏠', 'image', 'https://example.com/dad-house.jpg', 1, 10, 'ar'),
('منزلي', 'EXACT', 'منزلي الجميل 🏡', 'image', 'https://example.com/my-house.jpg', 1, 10, 'ar');

-- عرض السجلات
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('سجلات', 'EXACT', '{{records}}', 'text', 1, 50, 'ar');

-- إعدادات الذكاء الاصطناعي الافتراضية
INSERT OR IGNORE INTO ai_settings (provider, model, apiKey, maxTokens, temperature) VALUES
('groq', 'llama-3.1-8b-instant', '', 1500, 0.7);
