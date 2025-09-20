INSERT INTO rules (pattern, match_type, reply, lang, active, priority, only_in_business_hours)
VALUES
('#help', 'EXACT', 'الأوامر:\n- #help\n- ping\n- الوقت\n- echo <نص>\n(الردود من قاعدة البيانات 👀)', 'any', 1, 1, 0),
('ping', 'EXACT', 'pong ✅', 'any', 1, 5, 0),
('الوقت', 'EXACT', 'الوقت الآن: {{now}}', 'ar', 1, 10, 0),
('time', 'EXACT', 'Now: {{now}}', 'en', 1, 10, 0),
('echo ', 'STARTS_WITH', 'تكرار: {{tail}}', 'ar', 1, 20, 0),
('^echo\\s+(.+)$', 'REGEX', 'Echo: $1', 'en', 1, 25, 0);
