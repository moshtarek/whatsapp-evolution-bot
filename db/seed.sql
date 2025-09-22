-- بيانات أولية للبوت

-- إضافة قاعدة أمر "ذكي" للذكاء الاصطناعي
INSERT OR IGNORE INTO rules (
  pattern, 
  match_type, 
  reply, 
  reply_type, 
  active, 
  priority, 
  lang, 
  only_in_business_hours
) VALUES (
  'ذكي', 
  'STARTS_WITH', 
  'AI_RESPONSE', 
  'ai', 
  1, 
  1, 
  'ar', 
  0
);

-- قواعد أساسية للردود
INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, active, priority, lang) VALUES
('ping', 'EXACT', 'pong! البوت يعمل بشكل طبيعي ✅', 'text', 1, 10, 'ar'),
('مرحبا', 'EXACT', 'أهلاً وسهلاً! 👋 كيف يمكنني مساعدتك؟', 'text', 1, 10, 'ar'),
('السلام عليكم', 'EXACT', 'وعليكم السلام ورحمة الله وبركاته 🌙', 'text', 1, 10, 'ar'),
('شكرا', 'CONTAINS', 'العفو! سعيد لمساعدتك 😊', 'text', 1, 10, 'ar'),
('مساعدة', 'CONTAINS', 'يمكنني مساعدتك في:\n• الردود التلقائية\n• الذكاء الاصطناعي (ذكي + سؤالك)\n• إرسال الرسائل\n\nما تحتاج؟', 'text', 1, 10, 'ar');

-- إعدادات الذكاء الاصطناعي الافتراضية
INSERT OR IGNORE INTO ai_settings (provider, model, api_key) VALUES
('groq', 'llama-3.1-8b-instant', NULL);
