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
    if (!category || !locale || !(category in catalogs)) {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: "not found" }));
      return;
    }
    response.end(
      JSON.stringify({
        locale,
        category,
        version: 1,
        entries: catalogs[category],
      }),
    );
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not found" }));
});

server.listen(Number(process.env.MOCK_API_PORT ?? "14321"), "127.0.0.1");
