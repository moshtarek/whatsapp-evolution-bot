INSERT INTO rules (pattern, match_type, reply, reply_type, media_url, filename, lang, active, priority, only_in_business_hours)
VALUES
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

('ping', 'EXACT', 'pong ✅', 'text', NULL, NULL, 'any', 1, 5, 0),

('سجلات', 'EXACT', '📋 جميع السجلات في قاعدة البيانات:

{{records}}', 'text', NULL, NULL, 'ar', 1, 2, 0),

('^بيتي\\s+(9665\\d{8})$', 'REGEX', '🏠 منزلي:

📍 الإحداثيات:
خط العرض: 21.561153° شمالاً
خط الطول: 39.776638° شرقاً

🗺️ عرض على الخريطة:
https://maps.google.com/?q=21.561153,39.776638', 'image', 'http://bot.lan/myhome.jpg', NULL, 'ar', 1, 2, 0),

('موقعي', 'EXACT', '🏠 منزلي:

📍 الإحداثيات:
خط العرض: 21.561153° شمالاً
خط الطول: 39.776638° شرقاً

🗺️ عرض على الخريطة:
https://maps.google.com/?q=21.561153,39.776638', 'image', 'https://example.com/myhome.jpg', NULL, 'ar', 1, 3, 0),

('بيتي', 'EXACT', '🏠 منزلي:

📍 الإحداثيات:
خط العرض: 21.561153° شمالاً
خط الطول: 39.776638° شرقاً

🗺️ عرض على الخريطة:
https://maps.google.com/?q=21.561153,39.776638', 'image', 'http://bot.lan/myhome.jpg', NULL, 'ar', 1, 3, 0),

('عنواني', 'EXACT', 'العنوان المختصر: *MWUB2974*

العنوان الوطني:
رقم المبنى: *2974*، اسم الشارع: *الخبيرة*
الرقم الفرعي: *7509*، اسم الحي: *حي العمرة*
الرمز البريدي: *24416*
المدينة: *مكة المكرمة*', 'text', NULL, NULL, 'ar', 1, 4, 0),

('^موقع\\s+(.+)$', 'REGEX', '📍 تم البحث عن موقع: $1

🔍 يمكنك البحث عن هذا الموقع على:
🗺️ Google Maps: https://www.google.com/maps/search/$1
🌐 أو ابحث مباشرة في تطبيق الخرائط عن: $1', 'text', NULL, NULL, 'ar', 1, 5, 0),

('^طقس\\s+(.+)$', 'REGEX', '🌤️ طقس $1:

🔍 يمكنك معرفة حالة الطقس من:

🌐 موقع الطقس العالمي:
https://weather.com/weather/today/l/$1

📱 أو ابحث في Google عن:
https://www.google.com/search?q=طقس+$1

☀️ للحصول على معلومات دقيقة ومحدثة عن درجة الحرارة والرطوبة والرياح', 'text', NULL, NULL, 'ar', 1, 6, 0),

('^يوتيوب\\s+(.+)$', 'REGEX', '📺 البحث عن قناة: $1

🔍 روابط البحث:

🎥 بحث مباشر في يوتيوب:
https://www.youtube.com/results?search_query=$1

📱 رابط تطبيق يوتيوب:
https://m.youtube.com/results?search_query=$1

💡 نصيحة: اضغط على الرابط للوصول مباشرة لنتائج البحث عن القناة', 'text', NULL, NULL, 'ar', 1, 7, 0),

('الوقت', 'EXACT', 'الوقت الآن: {{now}}', 'text', NULL, NULL, 'ar', 1, 10, 0),

('time', 'EXACT', 'Now: {{now}}', 'text', NULL, NULL, 'en', 1, 10, 0),

('gmail', 'CONTAINS', '📧 موقع Gmail:
https://gmail.com

يمكنك الوصول إلى بريدك الإلكتروني من خلال هذا الرابط', 'text', NULL, NULL, 'ar', 1, 15, 0),

('hotmail', 'CONTAINS', '📧 موقع Hotmail (Outlook):
https://outlook.live.com

يمكنك الوصول إلى بريدك الإلكتروني من خلال هذا الرابط', 'text', NULL, NULL, 'ar', 1, 16, 0),

('outlook', 'CONTAINS', '📧 موقع Outlook:
https://outlook.live.com

يمكنك الوصول إلى بريدك الإلكتروني من خلال هذا الرابط', 'text', NULL, NULL, 'ar', 1, 17, 0),

('موقع الحرم', 'CONTAINS', '🕋 موقع الحرم المكي الشريف:

📍 الإحداثيات:
خط العرض: 21.4225° شمالاً
خط الطول: 39.8262° شرقاً

🗺️ رابط الموقع على الخريطة:
https://maps.google.com/?q=21.4225,39.8262

📱 رابط مباشر لتطبيق الخرائط:
https://www.google.com/maps/place/Great+Mosque+of+Mecca/@21.4225,39.8262,17z', 'text', NULL, NULL, 'ar', 1, 18, 0),

('الحرم', 'CONTAINS', '🕋 الحرم المكي الشريف:

📍 الإحداثيات:
21.4225° شمالاً، 39.8262° شرقاً

🗺️ عرض على الخريطة:
https://maps.google.com/?q=21.4225,39.8262', 'text', NULL, NULL, 'ar', 1, 19, 0),

('echo ', 'STARTS_WITH', 'تكرار: {{tail}}', 'text', NULL, NULL, 'ar', 1, 20, 0),

('^echo\\s+(.+)$', 'REGEX', 'Echo: $1', 'text', NULL, NULL, 'en', 1, 25, 0),

('رصيد', 'CONTAINS', 'للاستعلام عن الرصيد: أرسل "رصيد 12345".', 'text', NULL, NULL, 'ar', 1, 50, 1),

('^إرسال\\s+(9665\\d{8})\\s+(.+)$', 'REGEX', 'تم إرسال الرسالة: $2', 'text', NULL, NULL, 'ar', 1, 15, 0);
