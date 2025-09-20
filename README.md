# WhatsApp Bot over Evolution API (Node.js + SQLite)

بوت واتساب يعتمد على Evolution API مع قاعدة بيانات SQLite لقواعد الردود.

## 🐳 Docker Hub
الصورة متوفرة على Docker Hub ومتوافقة مع جميع الأنظمة (AMD64 + ARM64):
```bash
docker pull moshtarek/whatsapp-evolution-bot:latest
```

## ✅ المزايا
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

### المزايا:
- إضافة قواعد جديدة بسهولة
- تعديل القواعد الموجودة
- حذف القواعد غير المرغوبة
- عرض جميع القواعد في جدول منظم
- واجهة عربية سهلة الاستخدام

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

### المتغيرات في الرد
- `{{now}}` : الوقت الحالي `YYYY-MM-DD HH:mm:ss`.
- `{{tail}}` : الجزء بعد `pattern` في STARTS_WITH.
- `$1..$9` : مجموعات REGEX.

---

## 🔒 الأمان
- يُفضّل تقييد الوصول إلى `/webhook` داخل الشبكة أو استخدام توقيع/رمز سرّي.
- لا ترفع ملف `.env` علنًا.

---

## 🧩 ملاحظات
- إذا اختلف هيكل Webhook في نسختك، عدّل `parseIncoming` في `src/routes.js`.
- يمكن إضافة قوالب لإرسال ميديا/قوالب (templateMessage) لاحقًا في `src/services/evolution.js`.
