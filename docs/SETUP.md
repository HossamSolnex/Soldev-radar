# إعداد Soldev Radar

نسخة مستقلة (standalone) من وحدة رادار التقنية والذكاء الاصطناعي — بدون تسجيل
دخول، قراءة عامة من Supabase، وحفظ العناصر محليًا في المتصفح (localStorage).

## 1. إنشاء مشروع Supabase

1. أنشئ مشروع جديد على [supabase.com](https://supabase.com) (منفصل تمامًا عن
   أي مشروع آخر).
2. من SQL Editor، شغّل محتوى `supabase/migrations/001_tech_radar.sql`.
3. من Settings → API، خذ:
   - `Project URL`
   - `anon public` key (آمن للواجهة الأمامية — القراءة فقط عبر RLS)
   - `service_role` key (سري — يُستخدم فقط في سكربت التوليد اليومي)

## 2. GitHub Secrets

من Repo → Settings → Secrets and variables → Actions، أضف:

| Secret | الاستخدام |
|---|---|
| `SUPABASE_URL` | يُستخدم في كل من سكربت التوليد وبناء الواجهة (كـ `VITE_SUPABASE_URL`) |
| `SUPABASE_SERVICE_ROLE_KEY` | لسكربت التوليد اليومي فقط — يتجاوز RLS للكتابة |
| `SUPABASE_ANON_KEY` | يُستخدم في بناء الواجهة (كـ `VITE_SUPABASE_ANON_KEY`) — آمن للعرض العام |
| `OPENAI_API_KEY` | اختياري لكن موصى به — لتفعيل تلخيص وتصنيف الأخبار بالذكاء الاصطناعي |

> **تنبيه أمني:** `SUPABASE_SERVICE_ROLE_KEY` يتجاوز كل صلاحيات RLS — لا تضعه
> أبدًا في كود الواجهة الأمامية، فقط في GitHub Secrets حيث يُستخدم داخل مهمة
> الـ CI الخاصة بالتوليد فقط.

## 3. تفعيل GitHub Pages

من Repo → Settings → Pages → Source: اختر **GitHub Actions**.
عند أول push إلى `main`، سيعمل `.github/workflows/deploy.yml` تلقائيًا
ويبني الموقع وينشره.

## 4. التشغيل اليدوي للنشرة (أول مرة أو للاختبار)

```bash
cd scripts/tech-radar
npm install
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
OPENAI_API_KEY=sk-... \
node generate-digest.mjs
```

أو شغّل المهمة يدويًا من تبويب Actions في GitHub عبر زر "Run workflow"
(`Tech & AI Daily Radar`).

## 5. التشغيل محليًا (الواجهة)

```bash
cp .env.example .env
# املأ VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## تعديل المصادر

عدّل `scripts/tech-radar/sources.mjs` لإضافة/حذف مصادر RSS. كل مصدر بحاجة
فقط لاسم ورابط RSS وتلميح تصنيف اختياري (`hint`) يُستخدم فقط في وضع
التجميع الاحتياطي بدون AI.

## الفرق عن نسخة Hossam OS

- لا يوجد تسجيل دخول أو جدول مستخدمين — القراءة عامة عبر RLS
  (`tech_radar_digests_public_read`)، والكتابة فقط عبر service role key من
  الـ CI.
- الحفظ (bookmarking) يتم محليًا في المتصفح (`localStorage`) بدلًا من جدول
  `tech_radar_saved_items` المرتبط بمستخدم.
- تم حذف مسار "الخادم الذاتي" (custom backend fallback) من سكربت التوليد —
  Supabase فقط.
- النشر عبر GitHub Pages بدلًا من الدمج داخل تطبيق Hossam OS.
