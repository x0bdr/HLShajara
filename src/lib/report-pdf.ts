import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import type { submissions as submissionsTable } from "@/db/schema";
import {
  getCategoryConfig,
  getSubTypeConfig,
  type DetailFieldId,
} from "@/lib/wizard/category-config";

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
const LOGO_PATH = path.join(process.cwd(), "public", "logo.jpeg");

function toBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64");
}

const FONTS = {
  display: {
    normal: toBase64(path.join(FONT_DIR, "thmanyahserifdisplay-Regular.otf")),
    bold: toBase64(path.join(FONT_DIR, "thmanyahserifdisplay-Bold.otf")),
  },
  reading: {
    normal: toBase64(path.join(FONT_DIR, "thmanyahseriftext-Regular.otf")),
    bold: toBase64(path.join(FONT_DIR, "thmanyahseriftext-Bold.otf")),
  },
  sans: {
    normal: toBase64(path.join(FONT_DIR, "thmanyahsans-Regular.otf")),
    bold: toBase64(path.join(FONT_DIR, "thmanyahsans-Bold.otf")),
  },
};

const LOGO_BASE64 = fs.existsSync(LOGO_PATH) ? toBase64(LOGO_PATH) : "";

const COLORS = {
  paper: "#F7F3EA",
  paperRaised: "#FCFAF3",
  ink: "#1B1A16",
  secondary: "#6B6457",
  muted: "#8A8273",
  border: "#E1DBCC",
  brand: "#264D2E",
  brandDark: "#16301E",
};

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
  professorName: "اسم الأستاذ الجامعي",
  universityDoctorName: "اسم الطبيب الجامعي",
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
  labourMembers: "الأعضاء / العمال",
  supportDataInfo: "غير ذلك",
  clubName: "اسم النادي / الجمعية",
  academicStaff: "الكادر الأكاديمي",
  doctors: "الأطباء",
  nurses: "الممرضون",
  members: "الأعضاء",
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(key: string, raw: unknown): string {
  if (key === "googleMapsLink" || key === "websiteName" || key === "mediaLink") {
    const url = String(raw);
    return `<a href="${escapeHtml(url)}" dir="auto">${escapeHtml(url)}</a>`;
  }
  if (key === "ownerNames" || key === "investorNames") {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((v) => escapeHtml(String(v))).join(" · ");
  }
  if (key === "labourEntries") {
    const arr = Array.isArray(raw) ? (raw as { name?: string; role?: string }[]) : [];
    return arr
      .filter((e) => e.name || e.role)
      .map((e) => (e.name && e.role ? `${escapeHtml(e.name)} (${escapeHtml(e.role)})` : escapeHtml(e.name || e.role || "")))
      .join(" · ");
  }
  if (key === "socialContactMethods" || key === "contactMethods") {
    const arr = Array.isArray(raw) ? (raw as { type: string; value: string }[]) : [];
    return arr.map((m) => `${escapeHtml(m.type)}: ${escapeHtml(m.value)}`).join(" · ");
  }
  if (key === "supportingDocuments" || key === "detailFlags") {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((v) => escapeHtml(String(v))).join(" · ");
  }
  return escapeHtml(displayValue(raw));
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function formatMetadata(meta: Record<string, unknown>, allowedKeys: Set<string>): string {
  const rows = Object.entries(METADATA_LABELS_AR)
    .map(([key, label]) => {
      if (!allowedKeys.has(key)) return "";
      const raw = meta[key];
      if (isEmptyValue(raw)) return "";
      return `<tr><td class="meta-label">${label}</td><td class="meta-value">${formatValue(key, raw)}</td></tr>`;
    })
    .filter(Boolean)
    .join("");

  return rows ? `<table class="meta-table">${rows}</table>` : "";
}

function formatSourceLinks(links: SourceLink[] | null | undefined): string {
  if (!links || links.length === 0) return "<p class=\"empty\">لا توجد روابط مصادر.</p>";
  return `<ul class="source-list">${links
    .map(
      (l) =>
        `<li><a href="${escapeHtml(l.url)}" dir="auto">${escapeHtml(l.title || l.url)}</a></li>`
    )
    .join("")}</ul>`;
}

function formatSourceFiles(files: SourceFile[] | null | undefined): string {
  if (!files || files.length === 0) return "<p class=\"empty\">لا توجد ملفات مرفقة.</p>";
  return `<ul class="source-list">${files
    .map(
      (f) =>
        `<li>${f.label ? `${escapeHtml(f.label)} — ` : ""}${escapeHtml(f.originalName)} — <a href="${escapeHtml(f.url)}" dir="auto">رابط</a></li>`
    )
    .join("")}</ul>`;
}

const COMMON_META_KEYS = new Set<string>([
  "country",
  "state",
  "city",
  "nearestLocation",
  "address",
  "governorate",
  "contactPhone",
  "websiteName",
  "entityEmail",
  "googleMapsLink",
  "socialMediaAccounts",
  "socialContactMethods",
  "contactMethods",
  "orgType",
  "orgSubType",
  "orgSubTypeOther",
  "supportingDocuments",
  "detailFlags",
  "mediaNotes",
  "mediaLink",
]);

function getAllowedMetaKeys(category: string | null, orgType: string | undefined): Set<string> {
  const allowed = new Set<string>(COMMON_META_KEYS);

  const catConfig = getCategoryConfig(category ?? undefined);
  if (catConfig) {
    const subConfig = getSubTypeConfig(category ?? undefined, orgType);
    if (subConfig?.detailFields) {
      for (const field of subConfig.detailFields) {
        allowed.add(field);
      }
    }
  }

  return allowed;
}

export async function generateSubmissionPdf(submission: Submission): Promise<Buffer> {
  const meta = (submission.reportMetadata as Record<string, unknown>) ?? {};
  const sourceLinks = (submission.sourceLinks as SourceLink[] | null) ?? [];
  const sourceFiles = (submission.sourceFiles as SourceFile[] | null) ?? [];
  const createdAt = new Date(submission.createdAt).toLocaleString("ar-SA");
  const allowedKeys = getAllowedMetaKeys(submission.reportCategory, meta.orgType as string | undefined);

  const logoImg = LOGO_BASE64
    ? `<img src="data:image/jpeg;base64,${LOGO_BASE64}" class="logo" alt="HLShajara" />`
    : "";

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>بلاغ #${submission.id}</title>
  <style>
    @font-face {
      font-family: 'thmanyah-display';
      src: url('data:font/opentype;base64,${FONTS.display.normal}') format('opentype');
      font-weight: normal;
    }
    @font-face {
      font-family: 'thmanyah-display';
      src: url('data:font/opentype;base64,${FONTS.display.bold}') format('opentype');
      font-weight: bold;
    }
    @font-face {
      font-family: 'thmanyah-reading';
      src: url('data:font/opentype;base64,${FONTS.reading.normal}') format('opentype');
      font-weight: normal;
    }
    @font-face {
      font-family: 'thmanyah-reading';
      src: url('data:font/opentype;base64,${FONTS.reading.bold}') format('opentype');
      font-weight: bold;
    }
    @font-face {
      font-family: 'thmanyah-sans';
      src: url('data:font/opentype;base64,${FONTS.sans.normal}') format('opentype');
      font-weight: normal;
    }
    @font-face {
      font-family: 'thmanyah-sans';
      src: url('data:font/opentype;base64,${FONTS.sans.bold}') format('opentype');
      font-weight: bold;
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'thmanyah-sans', sans-serif;
      font-size: 11px;
      line-height: 1.6;
      color: ${COLORS.ink};
      background: ${COLORS.paper};
      padding: 0;
      margin: 0;
      direction: rtl;
    }

    .page {
      padding: 32px;
      max-width: 780px;
      margin: 0 auto;
    }

    header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${COLORS.brand};
      margin-bottom: 24px;
    }

    .logo {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 50%;
      border: 2px solid ${COLORS.brand};
    }

    .brand {
      flex: 1;
    }

    .brand-title {
      font-family: 'thmanyah-display', serif;
      font-size: 20px;
      font-weight: bold;
      color: ${COLORS.brandDark};
      margin: 0;
    }

    .brand-subtitle {
      font-family: 'thmanyah-sans', sans-serif;
      font-size: 11px;
      color: ${COLORS.secondary};
      margin: 4px 0 0;
    }

    .report-id {
      text-align: left;
      color: ${COLORS.muted};
      font-size: 10px;
      direction: ltr;
    }

    .report-id strong {
      display: block;
      font-size: 14px;
      color: ${COLORS.ink};
    }

    h1 {
      font-family: 'thmanyah-display', serif;
      font-size: 22px;
      font-weight: bold;
      color: ${COLORS.brandDark};
      margin: 0 0 6px;
    }

    .meta-bar {
      display: flex;
      gap: 16px;
      color: ${COLORS.secondary};
      font-size: 10px;
      margin-bottom: 24px;
    }

    .card {
      background: ${COLORS.paperRaised};
      border: 1px solid ${COLORS.border};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .card h2 {
      font-family: 'thmanyah-display', serif;
      font-size: 13px;
      font-weight: bold;
      color: ${COLORS.brand};
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${COLORS.border};
    }

    .description {
      font-family: 'thmanyah-reading', serif;
      font-size: 12px;
      line-height: 1.75;
      white-space: pre-wrap;
      text-align: right;
    }

    .description[dir="ltr"], h1[dir="ltr"], p[dir="ltr"], span[dir="ltr"] {
      text-align: left;
    }

    .description[dir="rtl"], h1[dir="rtl"], p[dir="rtl"], span[dir="rtl"] {
      text-align: right;
    }

    .meta-table {
      width: 100%;
      border-collapse: collapse;
    }

    .meta-table td {
      padding: 8px 10px;
      border: 1px solid ${COLORS.border};
      vertical-align: top;
    }

    .meta-table tr:nth-child(odd) {
      background: rgba(38, 77, 46, 0.03);
    }

    .meta-label {
      width: 32%;
      background: rgba(38, 77, 46, 0.08);
      font-weight: bold;
      color: ${COLORS.brandDark};
      font-size: 10px;
    }

    .meta-value {
      text-align: right;
    }

    .source-list {
      margin: 0;
      padding-right: 18px;
    }

    .source-list li {
      margin-bottom: 6px;
    }

    a {
      color: ${COLORS.brand};
      text-decoration: none;
      word-break: break-all;
    }

    .empty {
      color: ${COLORS.muted};
      margin: 0;
    }

    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid ${COLORS.border};
      text-align: center;
      color: ${COLORS.muted};
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      ${logoImg}
      <div class="brand">
        <div class="brand-title">حملة لستَ شجرة</div>
        <div class="brand-subtitle">HLShajara · تقرير بلاغ جديد</div>
      </div>
      <div class="report-id">
        <strong>#${submission.id}</strong>
        ${createdAt}
      </div>
    </header>

    <h1 dir="auto">${escapeHtml(submission.entityName)}</h1>
    <div class="meta-bar">
      <span>نوع الجهة: <span dir="auto">${escapeHtml(submission.entityType)}</span></span>
      <span>التصنيف: <span dir="auto">${escapeHtml(submission.reportCategory ?? "—")}</span></span>
      <span>الحالة: <span dir="auto">${escapeHtml(submission.status)}</span></span>
    </div>

    <div class="card">
      <h2>الدور / المنصب المُبلَّغ عنه</h2>
      <p dir="auto">${escapeHtml(submission.entityRole)}</p>
    </div>

    <div class="card">
      <h2>وصف البلاغ</h2>
      <div class="description" dir="auto">${escapeHtml(submission.allegationDescription)}</div>
    </div>

    <div class="card">
      <h2>بيانات مصنّفة</h2>
      ${formatMetadata(meta, allowedKeys)}
    </div>

    <div class="card">
      <h2>روابط المصادر</h2>
      ${formatSourceLinks(sourceLinks)}
    </div>

    <div class="card">
      <h2>الملفات المرفقة</h2>
      ${formatSourceFiles(sourceFiles)}
    </div>

    <div class="footer">
      تم إنشاء هذا التقرير تلقائياً من النظام · hlshajara.com
    </div>
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
