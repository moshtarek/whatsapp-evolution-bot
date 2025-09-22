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
