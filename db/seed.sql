INSERT OR IGNORE INTO rules (pattern, match_type, reply, reply_type, media_url, filename, lang, active, priority, only_in_business_hours) VALUES

('#help', 'EXACT', 'الأوامر:
- #help
- ping
- الوقت
- echo <نص>
- gmail (للوصول لموقع Gmail)
- hotmail أو outlook (للوصول لموقع Outlook)
- سجلات (لعرض جميع السجلات)
- بيتي (صورة المنزل مع الإحداثيات)
- إرسال <رقم> <رسالة>

(الردود من قاعدة البيانات 👀)', 'text', NULL, NULL, 'any', 1, 1, 0),

('ping', 'EXACT', 'pong! 🏓', 'text', NULL, NULL, 'any', 1, 10, 0),
('الوقت', 'EXACT', 'الوقت الآن: {{now}}', 'text', NULL, NULL, 'ar', 1, 10, 0),
('^echo\\s+(.+)$', 'REGEX', '$1', 'text', NULL, NULL, 'any', 1, 10, 0),
('gmail', 'EXACT', '📧 Gmail: https://gmail.com', 'text', NULL, NULL, 'any', 1, 10, 0),
('hotmail', 'EXACT', '📧 Outlook: https://outlook.com', 'text', NULL, NULL, 'any', 1, 10, 0),
('outlook', 'EXACT', '📧 Outlook: https://outlook.com', 'text', NULL, NULL, 'any', 1, 10, 0),
('^طقس\\s+(.+)$', 'REGEX', '🌤️ طقس $1:

🔍 يمكنك معرفة حالة الطقس من:

📱 بحث Google:
https://www.google.com/search?q=طقس+$1

🌐 موقع AccuWeather:
https://www.accuweather.com/ar/search-locations?query=$1

🇸🇦 الأرصاد السعودية:
https://ncm.gov.sa/Ar/Weather/Pages/Forecast.aspx

☀️ للحصول على معلومات دقيقة ومحدثة عن درجة الحرارة والرطوبة والرياح', 'text', NULL, NULL, 'ar', 1, 6, 0),

('بيتي', 'EXACT', '🏠 منزلي:

📍 الإحداثيات:
خط العرض: 21.561153° شمالاً
خط الطول: 39.776638° شرقاً

🗺️ عرض على الخريطة:
https://maps.google.com/?q=21.561153,39.776638', 'image', 'https://example.com/myhome.jpg', NULL, 'ar', 1, 3, 0),

('سجلات', 'EXACT', '📋 جميع السجلات:

{{records}}', 'text', NULL, NULL, 'ar', 1, 50, 0);

INSERT OR IGNORE INTO authorized_numbers (phone_number, name, active) VALUES 
('4915237975618', 'Test User 1', 1),
('966500891589', 'Test User 2', 1),
('966546493834', 'Test User 3', 1),
('966548060769', 'Test User 4', 1),
('966569096200', 'Test User 5', 1),
('966582147460', 'Test User 6', 1),
('966599045697', 'Test User 7', 1);
