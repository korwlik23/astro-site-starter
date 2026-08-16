import { createServer } from "node:http";
import process from "node:process";
import { URL } from "node:url";

const locales = [
  {
    id: "locale-en",
    code: "en",
    name: "English",
    direction: "ltr",
    enabled: true,
    selectable: true,
    default: true,
  },
  {
    id: "locale-th",
    code: "th",
    name: "ไทย",
    direction: "ltr",
    enabled: true,
    selectable: true,
    default: false,
  },
  {
    id: "locale-ar",
    code: "ar",
    name: "العربية",
    direction: "rtl",
    enabled: true,
    selectable: true,
    default: false,
  },
];

const catalogs = {
  common: {
    brand: "Go Lang Starter",
    language: "ภาษา",
    skip_to_content: "ข้ามไปยังเนื้อหา",
  },
  navigation: {
    primary_label: "เมนูหลัก",
    features: "ความสามารถ",
    architecture: "สถาปัตยกรรม",
    faq: "คำถามที่พบบ่อย",
  },
  marketing: {
    headline: "พัฒนาระบบหลายภาษาอย่างปลอดภัยได้เร็วขึ้น",
    summary: "ฐานระบบที่พร้อมต่อยอด",
  },
};

const arabicCatalogs = {
  common: {
    brand: "Go Lang Starter",
    language: "اللغة",
    menu: "القائمة",
    home: "الرئيسية",
    breadcrumbs_label: "مسار التنقل",
    footer_note: "مصمم لينمو مع منتجك.",
    skip_to_content: "الانتقال إلى المحتوى",
  },
  navigation: {
    primary_label: "التنقل الرئيسي",
    home: "الرئيسية",
    features: "الميزات",
    architecture: "البنية",
    faq: "الأسئلة الشائعة",
    docs: "الوثائق",
    contact: "تواصل معنا",
  },
  marketing: {
    eyebrow: "بداية جاهزة للإنتاج",
    headline: "أنشئ منتجات آمنة ومتعددة اللغات بسرعة أكبر",
    summary: "أساس قابل لإعادة الاستخدام مبني على Go وVue وAstro مع ترجمة ديناميكية وإدارة قائمة على الصلاحيات.",
    primary_cta: "استكشف الأساس",
    features_eyebrow: "الأساس",
    features_title: "ثلاثة تطبيقات مركزة في حزمة موثوقة واحدة",
    features_summary: "يحتفظ كل تطبيق بسجل إصداراته مع مشاركة عقود API ثابتة وإصدارات محددة.",
    feature_api_title: "نواة API آمنة",
    feature_api_body: "Go وGin مع صلاحيات دقيقة وترجمة ديناميكية وحدود قواعد بيانات قابلة للنقل.",
    feature_admin_title: "لوحة تشغيل عملية",
    feature_admin_body: "إدارة مبنية بـVue حول جلسات آمنة وصلاحيات دقيقة ومسارات عمل سهلة الوصول.",
    feature_site_title: "موقع عام جاهز للبحث",
    feature_site_body: "Astro SSR مع روابط حسب اللغة وعناصر دلالية وروابط canonical وhreflang وبيانات منظمة.",
    architecture_eyebrow: "البنية",
    architecture_title: "مستودعات مستقلة وعقود واضحة وإصدارات متوقعة.",
    architecture_api_title: "Go API",
    architecture_api_body: "Gin · PostgreSQL · MariaDB/MySQL",
    architecture_admin_title: "إدارة Vue",
    architecture_admin_body: "لوحة خلفية قائمة على الصلاحيات",
    architecture_site_title: "موقع Astro",
    architecture_site_body: "SSR · SEO · GEO · AEO",
    faq_eyebrow: "الأسئلة الشائعة",
    faq_title: "أسئلة يجيب عنها المشروع منذ البداية",
    faq_language_question: "هل يمكن للنظام إضافة وتعديل أكثر من لغتين؟",
    faq_language_answer: "نعم. تأتي اللغات والقيم المترجمة من API أثناء التشغيل، لذلك يمكن للمشغلين إضافة اللغات وتصحيح النصوص دون تغيير الكود.",
    faq_database_question: "ما قواعد البيانات التي يستهدفها المشروع؟",
    faq_database_answer: "PostgreSQL هي القاعدة الأساسية، وMariaDB بما في ذلك سير عمل XAMPP هدف مدعوم لقابلية النقل.",
    footer_note: "أساس عملي لأنظمة CMS ولوحات الإدارة ومنتجات SaaS المستقبلية.",
  },
};

const catalogEntriesByLocale = {
  en: { common: {}, navigation: {}, marketing: {} },
  th: catalogs,
  ar: arabicCatalogs,
};

const platformGuide = {
  aeo: {},
  alternates: [],
  blocks: [{
    type: "text",
    data: {
      text: "A deterministic publishing workflow keeps draft, review, scheduling, revision, and public delivery states explicit. This long-form example verifies that readable content wraps safely across compact screens without creating horizontal overflow.",
    },
  }],
  content_id: "content-platform",
  content_key: "platform-guide",
  content_status: "published",
  content_version: 2,
  excerpt: "A practical guide to the platform publishing workflow.",
  geo: {},
  kind: "page",
  locale_id: "locale-en",
  path: "guides/platform",
  published_at: "2026-08-09T00:00:00Z",
  seo: {
    description: "A practical guide to the platform publishing workflow.",
    title: "Platform guide",
  },
  slug: "platform",
  title: "Platform guide",
  translation_id: "translation-platform-en",
  translation_status: "published",
  translation_version: 1,
  updated_at: "2026-08-09T00:00:00Z",
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (url.pathname === "/api/v1/locales") {
    response.end(JSON.stringify({ items: locales }));
    return;
  }
  if (url.pathname === "/api/v1/localization/catalog") {
    const category = url.searchParams.get("category");
    const locale = url.searchParams.get("locale");
    const entries = catalogEntriesByLocale[locale]?.[category];
    if (!category || !locale || entries === undefined) {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: "not found" }));
      return;
    }
    response.end(
      JSON.stringify({
        locale,
        category,
        version: 1,
        entries,
      }),
    );
    return;
  }
  if (url.pathname === "/api/v1/public/content/en/guides/platform") {
    response.setHeader("etag", '"content-v2"');
    response.setHeader("cache-control", "public, max-age=60, stale-while-revalidate=120");
    response.end(JSON.stringify(platformGuide));
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not found" }));
});

server.listen(Number(process.env.MOCK_API_PORT ?? "14321"), "127.0.0.1");
