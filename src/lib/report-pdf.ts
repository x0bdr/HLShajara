import puppeteer from "puppeteer";
import path from "path";
import type { submissions as submissionsTable } from "@/db/schema";

type Submission = typeof submissionsTable.$inferSelect;

interface SourceLink {
  url: string;
  title?: string;
}

interface SourceFile {
  url: string;
  originalName: string;
  label?: string;
}

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

const METADATA_LABELS_AR: Record<string, string> = {
  country: "الدولة",
  state: "المحافظة / الولاية",
  city: "المدينة",
  nearestLocation: "أقرب نقطة / منطقة",
  address: "العنوان",
  governorate: "المحافظة",
  contactPhone: "رقم تواصل الجهة",
  websiteName: "رابط الموقع الإلكتروني",
  entityEmail: "إيميل الجهة",
  googleMapsLink: "رابط Google Maps",
  socialMediaAccounts: "حسابات التواصل",
  socialContactMethods: "وسائل تواصل أخرى",
  orgType: "نوع الجهة",
  orgSubType: "النوع الفرعي",
  orgSubTypeOther: "نوع آخر (مُحدَّد)",
  ownerName: "المالك / الشركاء",
  ownerNames: "المالك / الشريك / الشركاء",
  reportedPersonName: "الاسم / الكنية المُبلَّغ عنه",
  reportedPersonNickname: "اللقب / الاسم المستعار",
  reportedPersonPhone: "رقم الهاتف",
  reportedPersonPosition: "المنصب / المهنة",
  reportedPersonSocialMedia: "حسابات التواصل",
  carType: "نوع السيارة",
  carPlate: "رقم اللوحة",
  driverPhone: "هاتف السائق",
  driverName: "اسم السائق",
  taxiNumber: "رقم التكسي",
  appName: "التطبيق / المكتب",
  propertyType: "نوع العقار",
  partnerName: "الشريك / الشركاء",
  investorName: "المستثمر / رئيس النادي",
  investorNames: "المستثمر / المستثمرين",
  receptionInfo: "استقبال / مكتب أمامي",
  labourInfo: "عمال / موظفون",
  labourEntries: "عمال / موظفون",
  supportDataInfo: "غير ذلك",
  clubName: "اسم النادي / الجمعية",
  supportingDocuments: "وثائق داعمة",
  detailFlags: "تفاصيل إضافية",
  mediaNotes: "ملاحظات الوسائط",
  mediaLink: "رابط وسائط إعلامية",
  contactMethods: "وسائل التواصل",
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  if (Array.isArray(value) && value.length === 0) return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatMetadata(meta: Record<string, unknown>): string {
  const rows = Object.entries(METADATA_LABELS_AR)
    .map(([key, label]) => {
      const raw = meta[key];
      if (raw === undefined || raw === null || (Array.isArray(raw) && raw.length === 0)) return "";
      let value = displayValue(raw);
      if (key === "googleMapsLink" || key === "websiteName" || key === "mediaLink") {
        value = `<a href="${raw}">${value}</a>`;
      }
      return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
    })
    .filter(Boolean)
    .join("");

  return rows ? `<table class="meta-table">${rows}</table>` : "";
}

function formatSourceLinks(links: SourceLink[] | null | undefined): string {
  if (!links || links.length === 0) return "<p>لا توجد روابط مصادر.</p>";
  return `<ul>${links
    .map(
      (l) =>
        `<li><a href="${l.url}">${l.title || l.url}</a></li>`
    )
    .join("")}</ul>`;
}

function formatSourceFiles(files: SourceFile[] | null | undefined): string {
  if (!files || files.length === 0) return "<p>لا توجد ملفات مرفقة.</p>";
  return `<ul>${files
    .map(
      (f) =>
        `<li>${f.label ? `${f.label} — ` : ""}${f.originalName} — <a href="${f.url}">رابط</a></li>`
    )
    .join("")}</ul>`;
}

export async function generateSubmissionPdf(submission: Submission): Promise<Buffer> {
  const meta = (submission.reportMetadata as Record<string, unknown>) ?? {};
  const sourceLinks = (submission.sourceLinks as SourceLink[] | null) ?? [];
  const sourceFiles = (submission.sourceFiles as SourceFile[] | null) ?? [];

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>بلاغ #${submission.id}</title>
  <style>
    @font-face {
      font-family: 'thmanyah';
      src: url('file://${FONT_DIR}/thmanyahsans-Regular.otf') format('opentype');
      font-weight: normal;
    }
    @font-face {
      font-family: 'thmanyah';
      src: url('file://${FONT_DIR}/thmanyahsans-Bold.otf') format('opentype');
      font-weight: bold;
    }
    body {
      font-family: 'thmanyah', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #111;
      padding: 24px;
      direction: rtl;
    }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .subtitle { color: #555; margin-bottom: 16px; }
    .section { margin-bottom: 16px; }
    .description {
      background: #f8f8f8;
      border: 1px solid #eee;
      padding: 12px;
      white-space: pre-wrap;
      border-radius: 6px;
    }
    .meta-table { width: 100%; border-collapse: collapse; }
    .meta-table td { padding: 6px 8px; border: 1px solid #ddd; vertical-align: top; }
    .meta-table .label { width: 35%; background: #f5f5f5; font-weight: bold; }
    ul { padding-right: 20px; }
    a { color: #0066cc; word-break: break-all; }
  </style>
</head>
<body>
  <h1>${submission.entityName}</h1>
  <div class="subtitle">${submission.entityType} · ${submission.reportCategory ?? "—"} · ${submission.status}</div>

  <div class="section">
    <h2>الدور / المنصب</h2>
    <p>${submission.entityRole}</p>
  </div>

  <div class="section">
    <h2>وصف البلاغ</h2>
    <div class="description">${submission.allegationDescription}</div>
  </div>

  <div class="section">
    <h2>بيانات إضافية</h2>
    ${formatMetadata(meta)}
  </div>

  <div class="section">
    <h2>روابط المصادر</h2>
    ${formatSourceLinks(sourceLinks)}
  </div>

  <div class="section">
    <h2>الملفات المرفقة</h2>
    ${formatSourceFiles(sourceFiles)}
  </div>

  <div class="section">
    <h2>معلومات التقديم</h2>
    <p>رقم البلاغ: ${submission.id}</p>
    <p>تاريخ التقديم: ${new Date(submission.createdAt).toLocaleString("ar-SA")}</p>
  </div>
</body>
</html>
`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16px", right: "16px", bottom: "16px", left: "16px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
