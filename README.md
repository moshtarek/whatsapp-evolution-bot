# WhatsApp Bot over Evolution API (Node.js + SQLite)

بوت واتساب يعتمد على Evolution API مع قاعدة بيانات SQLite لقواعد الردود.

## 🐳 Docker Hub
الصورة متوفرة على Docker Hub ومتوافقة مع جميع الأنظمة (AMD64 + ARM64):
```bash
docker pull moshtarek/whatsapp-evolution-bot:2.4.3
# أو الإصدار الأحدث
docker pull moshtarek/whatsapp-evolution-bot:latest
```

## ✅ المزايا الجديدة (v1.4.0)
- **دعم إرسال الصور والملفات** 🖼️📄
- **إرسال رسائل لأرقام محددة** (تبدأ بـ 9665) 📱
- **واجهة إدارة محسنة** مع دعم الملفات
- **قواعد ديناميكية محسنة** مع أنواع ردود متعددة

## ✅ المزايا الأساسية
- استقبال Webhook (MESSAGES_UPSERT)
- قواعد ديناميكية من قاعدة بيانات (EXACT/STARTS_WITH/CONTAINS/REGEX) مع أولوية
- ردود بـ placeholders (`{{now}}`, `{{tail}}`, `$1..$9`)
- ساعات عمل (Business Hours) قابلة للضبط
- **واجهة ويب** لإدارة القواعد (إضافة/تعديل/حذف)
- REST API لإدارة القواعد (CRUD)
- Docker/Docker Compose جاهز
- صورة Docker متوافقة مع AMD64 و ARM64

---

## ⚙️ الإعداد السريع

### باستخدام Docker Hub (الأسرع):
```bash
# نسخ ملف البيئة
cp .env.example .env
# تعديل القيم في .env

# تشغيل مع Docker Compose
docker compose up -d

# تهيئة قاعدة البيانات (أول مرة فقط)
docker exec -it wa-bot npm run db:init
docker exec -it wa-bot npm run db:seed
```

### التطوير المحلي:
1) انسخ `.env.example` إلى `.env` وعدّل القيم:
   - `EVOLUTION_BASE_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_API_KEY`
2) تهيئة قاعدة البيانات:
```bash
npm run db:init
npm run db:seed
# أو للترقية من إصدار سابق:
npm run db:migrate
```
3) تشغيل بدون Docker:
```bash
npm i
npm run dev
```

الخدمة تعمل افتراضيًا على: `http://localhost:3001`

---

## 🌐 الواجهة الويب لإدارة القواعد
بعد تشغيل الخدمة، يمكنك الوصول إلى واجهة الإدارة عبر:
```
http://localhost:3001
```

### المزايا الجديدة:
- **إضافة قواعد بالصور والملفات** 🖼️📄
- **اختيار نوع الرد**: نص، صورة، أو ملف
- **رفع روابط الملفات** مع أسماء مخصصة
- **عرض محسن** مع أيقونات مميزة لكل نوع

---

## 📱 الميزات الجديدة

### 1. إرسال الصور والملفات
```bash
# إضافة قاعدة بصورة
curl -X POST http://localhost:3001/rules \
  -H 'Content-Type: application/json' \
  -d '{
    "pattern": "صورة",
    "match_type": "EXACT",
    "reply": "هذه صورة تجريبية",
    "reply_type": "image",
    "media_url": "https://example.com/image.jpg",
    "active": 1,
    "priority": 10
  }'

# إضافة قاعدة بملف
curl -X POST http://localhost:3001/rules \
  -H 'Content-Type: application/json' \
  -d '{
    "pattern": "ملف",
    "match_type": "EXACT",
    "reply": "هذا ملف تجريبي",
    "reply_type": "document",
    "media_url": "https://example.com/file.pdf",
    "filename": "document.pdf",
    "active": 1,
    "priority": 10
  }'
```

### 2. إرسال لأرقام محددة
```
إرسال 966512345678 مرحبا بك
```
→ يرسل "مرحبا بك" للرقم 966512345678

---

## 🔗 ربط Webhook في Evolution API
(قد يختلف مسار الإعداد حسب نسختك)
أرسل طلب إعداد Webhook لربط حدث **MESSAGES_UPSERT** بعنوان البوت:

```bash
curl -X POST "$EVOLUTION_BASE_URL/webhook/set/$EVOLUTION_INSTANCE"   -H "Content-Type: application/json"   -H "apikey: $EVOLUTION_API_KEY"   -d '{
    "url": "http://YOUR_BOT_HOST:3001/webhook",
    "events": ["MESSAGES_UPSERT"],
    "webhook_by_events": false
  }'
```

> غيّر `YOUR_BOT_HOST` إلى IP/دومين البوت لديك.  
> لو واجهة الإعداد عندك مختلفة، استخدم المسار الموافق لنسختك (مثلاً `/instance/webhook/set`).

---

## 🧪 اختبار محلي
```bash
curl -X POST http://localhost:3001/webhook   -H "Content-Type: application/json"   -d '{
    "event": "MESSAGES_UPSERT",
    "key": { "remoteJid": "966500000000@s.whatsapp.net", "fromMe": false, "id": "MSG123" },
    "pushName": "Test User",
    "message": { "conversation": "ping" }
  }'
```

---

## 🗄️ REST API لإدارة القواعد
- عرض الكل:
```bash
curl http://localhost:3001/rules
```
- إضافة:
```bash
curl -X POST http://localhost:3001/rules   -H 'Content-Type: application/json'   -d '{
    "pattern":"مرحبا",
    "match_type":"EXACT",
    "reply":"أهلًا! كيف نقدر نخدمك؟",
    "reply_type":"text",
    "lang":"ar",
    "active":1,
    "priority":10,
    "only_in_business_hours":0
  }'
```
- تعديل:
```bash
curl -X PUT http://localhost:3001/rules/1   -H 'Content-Type: application/json'   -d '{"priority":2}'
```
- حذف:
```bash
curl -X DELETE http://localhost:3001/rules/1
```

### أنواع المطابقة
- `EXACT` : تطابق كامل.
- `STARTS_WITH` : يبدأ بـ (يدعم `{{tail}}`).
- `CONTAINS` : يحتوي على.
- `REGEX` : تعبير نمطي (يدعم `$1..$9`).

### أنواع الردود الجديدة
- `text` : رد نصي عادي
- `image` : إرسال صورة مع caption
- `document` : إرسال ملف مع caption

### المتغيرات في الرد
- `{{now}}` : الوقت الحالي `YYYY-MM-DD HH:mm:ss`.
- `{{tail}}` : الجزء بعد `pattern` في STARTS_WITH.
- `$1..$9` : مجموعات REGEX.
- `{{records}}` : عرض جميع القواعد في قاعدة البيانات.

---

## 🔒 الأمان
- يُفضّل تقييد الوصول إلى `/webhook` داخل الشبكة أو استخدام توقيع/رمز سرّي.
- لا ترفع ملف `.env` علنًا.

---

## 🧩 ملاحظات
- إذا اختلف هيكل Webhook في نسختك، عدّل `parseIncoming` في `src/routes.js`.
- يمكن إضافة قوالب لإرسال ميديا/قوالب (templateMessage) لاحقًا في `src/services/evolution.js`.

---

## 📋 سجل التحديثات

### v2.4.3 (2025-01-24)
- ✅ تحديث نماذج Gemini AI مع جميع الخيارات المتاحة
- ✅ إصلاحات في تكامل Gemini API
- ✅ تحسين نظام Migration الموحد
- ✅ دعم Gemini 2.0 Flash و 2.5 Flash models
- ✅ صورة Docker محدثة ومتوافقة مع AMD64 و ARM64

### v1.4.0 (2025-01-21)
- ✅ دعم إرسال الصور والملفات
- ✅ إرسال رسائل لأرقام محددة (9665xxxxxxxx)
- ✅ واجهة إدارة محسنة مع دعم الملفات
- ✅ قاعدة بيانات محدثة مع حقول جديدة
- ✅ صورة Docker متوافقة مع AMD64 و ARM64
