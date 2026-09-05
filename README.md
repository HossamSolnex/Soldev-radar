# Soldev Radar

رادار يومي بالعربية لأهم أخبار التقنية والذكاء الاصطناعي والتسويق — نسخة
مستقلة (standalone) من وحدة Tech & AI Radar المبنية داخل Hossam OS.

- **جمع الأخبار**: مصادر RSS مختارة (`scripts/tech-radar/sources.mjs`) +
  أعلى قصص Hacker News خلال آخر 36 ساعة.
- **التلخيص والتصنيف**: Claude (عبر `ANTHROPIC_API_KEY`) يصنف ويلخص أهم الأخبار
  بالعربية إلى نشرة منظمة بسبعة أقسام (تشمل AI، الشركات الكبرى، المنتجات،
  التمويل، مقالات، التسويق، والتخزين الذاتي/self-storage)؛ بدون المفتاح يعمل
  تجميع احتياطي بدون AI.
- **النشر**: مهمة GitHub Actions يومية تكتب النشرة إلى Supabase.
- **العرض**: واجهة React خفيفة بدون تسجيل دخول، تقرأ من Supabase بشكل عام
  (RLS)، منشورة على GitHub Pages.
- **الحفظ (Bookmarks)**: يتم محليًا في متصفحك عبر `localStorage` — لا حاجة
  لحساب مستخدم.

راجع [`docs/SETUP.md`](docs/SETUP.md) للتفاصيل الكاملة عن الإعداد
(مشروع Supabase، الأسرار، GitHub Pages).

## البنية

```
scripts/tech-radar/     سكربت التوليد اليومي (Node، RSS + HN + Claude + Supabase)
supabase/migrations/    مخطط قاعدة البيانات (digests فقط، قراءة عامة)
src/                    الواجهة الأمامية (Vite + React + TypeScript + Tailwind)
.github/workflows/      مهمة التوليد اليومي + نشر GitHub Pages
```

## التطوير محليًا

```bash
npm install
cp .env.example .env   # املأ متغيرات Supabase
npm run dev
```
