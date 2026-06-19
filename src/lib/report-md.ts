import type { submissions as submissionsTable } from "@/db/schema";
import {
  getSubTypeConfig,
  getCategoryLabelAr,
  getSubTypeLabelAr,
  getFlagLabelAr,
  getDocumentLabelAr,
} from "@/lib/wizard/category-config";
import { escapeMarkdown, safeHttpUrl } from "@/lib/escape";
import arMessages from "../../messages/ar.json";

type Submission = typeof submissionsTable.$inferSelect;

interface SourceFile {
  url: string;
  originalName: string;
  label?: string;
}

const arSubmit = (arMessages.submit as unknown) as Record<string, string>;
const arReviewer = (arMessages.reviewer as unknown) as Record<string, string>;
const arRecord = (arMessages.record as unknown) as Record<string, string>;

function arStatusLabel(status: string): string {
  return arReviewer[`status_${status}`] ?? arRecord[`status_${status}`] ?? status;
}

function arContactTypeLabel(type: string): string {
  return arSubmit[`contactType_${type}`] ?? type;
}

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "";
  return `${base}${url}`;
}

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
  "supportingDocuments",
  "detailFlags",
  "mediaLink",
  "mediaNotes",
  "contactMethods",
]);

function getAllowedMetaKeys(category: string | null, orgType: string | undefined): Set<string> {
  const allowed = new Set(COMMON_META_KEYS);
  const subConfig = getSubTypeConfig(category ?? undefined, orgType);
  if (subConfig?.detailFields) {
    for (const field of subConfig.detailFields) {
      allowed.add(field as string);
    }
  }
  return allowed;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function formatValue(
  key: string,
  raw: unknown,
  category: string | null,
  orgType: string | undefined,
): string {
  // System-generated label — not user-controlled, do not markdown-escape.
  if (key === "orgType") {
    return getSubTypeLabelAr(category ?? undefined, orgType);
  }
  if (key === "ownerNames" || key === "investorNames") {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((v) => escapeMarkdown(String(v))).join(" · ");
  }
  if (key === "labourEntries" || key === "labourMembers" || key === "academicStaff") {
    const arr = Array.isArray(raw) ? (raw as { name?: string; role?: string }[]) : [];
    return arr
      .filter((e) => e.name || e.role)
      .map((e) =>
        e.name && e.role
          ? `${escapeMarkdown(e.name)} (${escapeMarkdown(e.role)})`
          : escapeMarkdown(e.name || e.role || ""),
      )
      .join(" · ");
  }
  if (key === "socialContactMethods" || key === "contactMethods") {
    const arr = Array.isArray(raw) ? (raw as { type: string; value: string }[]) : [];
    return arr
      .map((m) => `${escapeMarkdown(arContactTypeLabel(m.type))}: ${escapeMarkdown(m.value)}`)
      .join(" · ");
  }
  // System-generated labels (document/flag) — not user-controlled.
  if (key === "supportingDocuments") {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((v) => getDocumentLabelAr(String(v))).join(" · ");
  }
  if (key === "detailFlags") {
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((v) => getFlagLabelAr(String(v))).join(" · ");
  }
  if (typeof raw === "boolean") return raw ? "نعم" : "لا";
  // Default: arbitrary user-controlled value — markdown-escape it.
  return escapeMarkdown(String(raw));
}

export async function generateSubmissionMarkdown(submission: Submission): Promise<string> {
  const meta = (submission.reportMetadata as Record<string, unknown>) ?? {};
  const sourceFiles = (submission.sourceFiles as SourceFile[] | null) ?? [];
  const createdAt = new Date(submission.createdAt).toLocaleString("ar-SA");
  const orgType = meta.orgType as string | undefined;
  const allowedKeys = getAllowedMetaKeys(submission.reportCategory, orgType);

  const metadataRows = Object.entries(METADATA_LABELS_AR)
    .map(([key, label]) => {
      if (!allowedKeys.has(key)) return null;
      const raw = meta[key];
      if (isEmptyValue(raw)) return null;
      return { label, value: formatValue(key, raw, submission.reportCategory, orgType) };
    })
    .filter((row): row is { label: string; value: string } => row !== null);


  const sourceFilesSection =
    sourceFiles.length > 0
      ? sourceFiles
          .map((file, i) => {
            const name = escapeMarkdown(file.originalName);
            const label = file.label ? ` — ${escapeMarkdown(file.label)}` : "";
            const url = safeHttpUrl(toAbsoluteUrl(file.url));
            return `${i + 1}. ${name}${label} — ${url}`;
          })
          .join("\n")
      : "لا توجد ملفات مرفقة.";

  const metadataSection =
    metadataRows.length > 0
      ? metadataRows.map((row) => `| ${row.label} | ${row.value} |`).join("\n")
      : "لا توجد بيانات مصنّفة إضافية.";

  return `# تقرير بلاغ #${submission.id}

**الجهة:** ${escapeMarkdown(submission.entityName)}
**التصنيف:** ${getCategoryLabelAr(submission.reportCategory)}
**النوع الفرعي:** ${getSubTypeLabelAr(submission.reportCategory, orgType)}
**الحالة:** ${arStatusLabel(submission.status)}
**تاريخ التقديم:** ${createdAt}

---

## وصف البلاغ

${escapeMarkdown(submission.allegationDescription) || "—"}

## بيانات مصنّفة

| البيان | القيمة |
| --- | --- |
${metadataSection}

## الملفات المرفقة

${sourceFilesSection}

---

*تم إنشاء هذا التقرير تلقائيًا من النظام · hlshajara.com*
`;
}
