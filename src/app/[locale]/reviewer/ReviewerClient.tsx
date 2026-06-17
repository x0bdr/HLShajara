"use client";

import { createElement, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TIER_LABELS } from "@/lib/labels";
import {
  getCategoryConfig,
  getSubTypeConfig,
  getCategoryLabel,
  getSubTypeLabel,
  getDocumentLabel,
} from "@/lib/wizard/category-config";
import { getIconByName } from "@/lib/wizard/icon-map";

interface SourceLink {
  url: string;
  title?: string;
}

interface SourceVerification {
  verified: boolean;
  supportsClaim: boolean;
  tier: "A" | "B" | "C";
  publisher: string;
  contentHash?: string;
  snapshotUrl?: string;
}

interface ReportMetadata {
  orgType?: string;
  orgSubTypeOther?: string;
  supportingDocuments?: string[];
  ownerName?: string;
  ownerNames?: string[];
  reportedPersonName?: string;
  reportedPersonNickname?: string;
  reportedPersonPhone?: string;
  reportedPersonPosition?: string;
  reportedPersonSocialMedia?: string;
  carType?: string;
  carPlate?: string;
  driverPhone?: string;
  driverName?: string;
  taxiNumber?: string;
  appName?: string;
  propertyType?: string;
  country?: string;
  city?: string;
  address?: string;
  nearestLocation?: string;
  contactPhone?: string;
  websiteName?: string;
  entityEmail?: string;
  googleMapsLink?: string;
  socialMediaAccounts?: string;
  socialContactMethods?: { type: string; value: string }[];
  investorNames?: string[];
  labourEntries?: { name: string; role: string }[];
  supportDataInfo?: string;
}

interface SourceFile {
  hash: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  label?: string;
}

interface Submission {
  id: number;
  entityName: string;
  entityType: string;
  entityRole: string;
  allegationDescription: string;
  status: string;
  sourceLinks: SourceLink[];
  sourceFiles: SourceFile[];
  createdAt: string;
  reportCategory: string | null;
  reportMetadata: ReportMetadata | null;
  triageConfirmedActor: boolean | null;
  triageConfirmedConduct: boolean | null;
  triageCategory: string | null;
  identityResolutionConfirmed: boolean | null;
  sourceVerification: SourceVerification[] | null;
  evidenceStrength: string | null;
  privacyCheckPassed: boolean | null;
  phrasingApproved: boolean | null;
  privacyRechecked: boolean | null;
  isDeceased: boolean | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  secondReviewedBy: number | null;
  secondReviewedByName: string | null;
}

const METADATA_LABELS_AR: Record<string, string> = {
  orgSubTypeOther: "نوع آخر (مُحدَّد)",
  ownerName: "المالك / الشركاء",
  ownerNames: "المالك / الشريك / الشركاء",
  reportedPersonName: "الاسم / الكنية المُبلَّغ عنه",
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
  country: "الدولة",
  city: "المحافظة / المدينة",
  address: "العنوان",
  nearestLocation: "أقرب نقطة / منطقة",
  contactPhone: "رقم تواصل الجهة",
  websiteName: "رابط الموقع الإلكتروني للجهة",
  entityEmail: "إيميل الجهة",
  googleMapsLink: "رابط Google Maps",
  socialMediaAccounts: "حسابات التواصل",
  socialContactMethods: "حسابات التواصل",
};

const METADATA_LABELS_EN: Record<string, string> = {
  orgSubTypeOther: "Other type (specified)",
  ownerName: "Owner / partners",
  ownerNames: "Owner / partner / partners",
  reportedPersonName: "Reported person name",
  reportedPersonPhone: "Phone number",
  reportedPersonPosition: "Position / occupation",
  reportedPersonSocialMedia: "Social accounts",
  carType: "Car type",
  carPlate: "License plate",
  driverPhone: "Driver phone",
  driverName: "Driver name",
  taxiNumber: "Taxi number",
  appName: "App / office",
  propertyType: "Property type",
  partnerName: "Partner name(s)",
  investorName: "Investor / club president",
  investorNames: "Investor / investors",
  receptionInfo: "Reception / front desk",
  labourInfo: "Labour / employees",
  labourEntries: "Labour / employees",
  supportDataInfo: "Other",
  clubName: "Club / association name",
  country: "Country",
  city: "State / City",
  address: "Address",
  nearestLocation: "Nearest point / area",
  contactPhone: "Entity contact number",
  websiteName: "Entity website link",
  entityEmail: "Entity email",
  googleMapsLink: "Google Maps link",
  socialMediaAccounts: "Social accounts",
  socialContactMethods: "Social accounts",
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  if (Array.isArray(value) && value.length === 0) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function getStatusLabel(status: string, t: (key: string) => string): string {
  const key = `status_${status}`;
  const label = t(key);
  // If no translation exists, fall back to the raw status string.
  return label === key ? status : label;
}

function formatLabels(
  values: string[],
  t: (key: string) => string,
  locale: string,
): string {
  if (!values || values.length === 0) return "—";
  return values
    .map((v) => getDocumentLabel(t, v))
    .join(locale === "ar" ? "، " : ", ");
}

function renderIcon(name: string | undefined, size?: number) {
  const Icon = getIconByName(name);
  return Icon ? createElement(Icon, { size }) : null;
}

function exportSubmissionToPDF(sub: Submission, locale: string) {
  const labels = locale === "ar" ? METADATA_LABELS_AR : METADATA_LABELS_EN;
  const meta = sub.reportMetadata ?? {};
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";

  function fmtValue(key: string, value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value) && value.length === 0) return "—";
    if (key === "ownerNames" || key === "investorNames") {
      return (value as string[]).join(locale === "ar" ? "، " : ", ");
    }
    if (key === "labourEntries") {
      return (value as { name?: string; role?: string }[])
        .filter((e) => e.name || e.role)
        .map((e) => (e.name && e.role ? `${e.name} (${e.role})` : e.name || e.role))
        .join(locale === "ar" ? "، " : ", ");
    }
    if (key === "socialContactMethods") {
      return (value as { type: string; value: string }[]).map((m) => `${m.type}: ${m.value}`).join(" · ");
    }
    if (key === "supportingDocuments") {
      return (value as string[]).map((v) => {
        const doc = ["photos", "videos", "audio", "documents", "screenshots", "other"].find((d) => d === v);
        return doc ? (locale === "ar" ? {
          photos: "صور", videos: "فيديو", audio: "تسجيلات صوتية", documents: "وثائق رسمية", screenshots: "لقطات شاشة", other: "أخرى",
        }[v] : {
          photos: "Photos", videos: "Videos", audio: "Audio recordings", documents: "Official documents", screenshots: "Screenshots", other: "Other",
        }[v]) : v;
      }).join(locale === "ar" ? "، " : ", ");
    }
    return String(value);
  }

  const metaRows = Object.entries(labels).map(([key, label]) => {
    const value = meta[key as keyof ReportMetadata];
    return `<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:600;width:35%">${label}</td><td style="padding:6px 10px;border:1px solid #ddd">${fmtValue(key, value)}</td></tr>`;
  }).join("");

  const mediaRows = sub.sourceFiles.length
    ? sub.sourceFiles.map((f) => `<tr><td style="padding:6px 10px;border:1px solid #ddd">${f.label ? `${f.label} — ` : ""}${f.originalName}</td><td style="padding:6px 10px;border:1px solid #ddd"><a href="${f.url}" target="_blank">${f.url}</a></td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:6px 10px;border:1px solid #ddd">—</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html dir="${dir}">
    <head>
      <meta charset="utf-8">
      <title>${locale === "ar" ? "بلاغ" : "Report"} #${sub.id}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
        p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
        td { vertical-align: top; }
        .section { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1 style="text-align:${align}">${sub.entityName}</h1>
      <p style="text-align:${align}">${resolveSubTypeLabel(sub, () => "")} · ${resolveCategoryLabel(sub, () => "")}</p>

      <div class="section">
        <h2 style="text-align:${align}">${locale === "ar" ? "وصف البلاغ" : "Report Description"}</h2>
        <p style="text-align:${align};white-space:pre-wrap">${sub.allegationDescription}</p>
      </div>

      <div class="section">
        <h2 style="text-align:${align}">${locale === "ar" ? "بيانات البلاغ المصنّفة" : "Categorized Report Data"}</h2>
        <table>${metaRows}</table>
      </div>

      <div class="section">
        <h2 style="text-align:${align}">${locale === "ar" ? "الوسائط الداعمة" : "Supporting Media"}</h2>
        <table>
          <thead><tr><th style="padding:6px 10px;border:1px solid #ddd;text-align:${align}">${locale === "ar" ? "الوسيط" : "Media"}</th><th style="padding:6px 10px;border:1px solid #ddd;text-align:${align}">${locale === "ar" ? "الرابط" : "Link"}</th></tr></thead>
          <tbody>${mediaRows}</tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function resolveCategoryLabel(sub: Submission, t: (key: string) => string) {
  const cat = getCategoryConfig(sub.reportCategory ?? undefined);
  if (!cat) return displayValue(sub.reportCategory);
  return getCategoryLabel(t, cat.id);
}

function resolveSubTypeLabel(sub: Submission, t: (key: string) => string) {
  const meta = sub.reportMetadata ?? {};
  if (!meta.orgType) return displayValue(meta.orgType);
  const label = getSubTypeLabel(t, sub.reportCategory ?? undefined, meta.orgType);
  if (meta.orgType === "other" && meta.orgSubTypeOther) {
    return `${label} — ${meta.orgSubTypeOther}`;
  }
  return label;
}

function MetadataRow({ label, value, link }: { label: string; value: unknown; link?: boolean }) {
  const text = displayValue(value);
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      {link && text !== "—" ? (
        <a className="meta-value" href={String(value)} target="_blank" rel="noreferrer">{text}</a>
      ) : (
        <span className="meta-value">{text}</span>
      )}
    </div>
  );
}

function SubmissionMetadata({ sub, locale, t }: { sub: Submission; locale: string; t: (key: string) => string }) {
  const meta = sub.reportMetadata ?? {};
  const cat = getCategoryConfig(sub.reportCategory ?? undefined);
  const subTypeConfig = getSubTypeConfig(sub.reportCategory ?? undefined, meta.orgType);
  const labels = locale === "ar" ? METADATA_LABELS_AR : METADATA_LABELS_EN;

  return (
    <section className="form-section mb-20">
      <div className="form-section-title">{locale === "ar" ? "بيانات البلاغ المصنّفة" : "Categorized report data"}</div>

      <div className="meta-row">
        <span className="meta-label">{locale === "ar" ? "التصنيف" : "Category"}</span>
        <span className="meta-value with-icon">
          {renderIcon(cat?.iconName, 16)}
          {resolveCategoryLabel(sub, t)}
        </span>
      </div>

      <div className="meta-row">
        <span className="meta-label">{locale === "ar" ? "النوع الفرعي" : "Sub-type"}</span>
        <span className="meta-value with-icon">
          {renderIcon(subTypeConfig?.iconName, 16)}
          {resolveSubTypeLabel(sub, t)}
        </span>
      </div>

      <div className="meta-row">
        <span className="meta-label">{locale === "ar" ? "وثائق داعمة" : "Supporting documents"}</span>
        <span className="meta-value">{formatLabels(meta.supportingDocuments ?? [], t, locale)}</span>
      </div>

      {Object.entries(labels).map(([key, label]) => {
        const value = meta[key as keyof ReportMetadata];
        if (key === "googleMapsLink") {
          return <MetadataRow key={key} label={label} value={value} link />;
        }
        if (key === "ownerNames" || key === "investorNames") {
          const arr = (value as string[] | undefined) ?? [];
          return <MetadataRow key={key} label={label} value={arr.join(locale === "ar" ? "، " : ", ")} />;
        }
        if (key === "labourEntries") {
          const arr = (value as { name?: string; role?: string }[] | undefined) ?? [];
          const text = arr
            .filter((e) => e.name || e.role)
            .map((e) => (e.name && e.role ? `${e.name} (${e.role})` : e.name || e.role))
            .join(locale === "ar" ? "، " : ", ");
          return <MetadataRow key={key} label={label} value={text} />;
        }
        if (key === "socialContactMethods") {
          const arr = (value as { type: string; value: string }[] | undefined) ?? [];
          const text = arr.map((m) => `${m.type}: ${m.value}`).join(" · ");
          return <MetadataRow key={key} label={label} value={text} />;
        }
        return <MetadataRow key={key} label={label} value={value} />;
      })}
    </section>
  );
}

export default function ReviewerPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<Submission | null>(null);
  const t = useTranslations("reviewer");
  const tSubmit = useTranslations("submit");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSubmissions(data.submissions);
        } else {
          setError(data.message || t("loadError"));
        }
      })
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  interface ActExtra {
    triageConfirmedActor?: boolean | null;
    triageConfirmedConduct?: boolean | null;
    triageCategory?: string | null;
    identityResolutionConfirmed?: boolean | null;
    sourceVerification?: SourceVerification[];
    evidenceStrength?: string | null;
    privacyCheckPassed?: boolean | null;
    phrasingApproved?: boolean | null;
    privacyRechecked?: boolean | null;
    isDeceased?: boolean | null;
    rejectionNote?: string | null;
    hasLawyerSignOff?: boolean;
  }

  async function act(id: number, action: string, extra?: ActExtra) {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, submissionId: id, ...extra }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert(data.message || "Action failed");
      return;
    }
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setSelected(null);
  }

  async function saveTriage(sub: Submission) {
    const verifications = sub.sourceLinks.map((_, i) => (sub.sourceVerification?.[i] ?? { verified: false, supportsClaim: false, tier: "C" as const, publisher: "" }));
    await act(sub.id, "triage", {
      triageConfirmedActor: sub.triageConfirmedActor,
      triageConfirmedConduct: sub.triageConfirmedConduct,
      triageCategory: sub.triageCategory,
      identityResolutionConfirmed: sub.identityResolutionConfirmed,
      sourceVerification: verifications,
      evidenceStrength: sub.evidenceStrength,
      privacyCheckPassed: sub.privacyCheckPassed,
      phrasingApproved: sub.phrasingApproved,
      privacyRechecked: sub.privacyRechecked,
      isDeceased: sub.isDeceased,
    });
    alert("Triage saved.");
  }

  function updateSub(id: number, patch: Partial<Submission>) {
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    if (selected && selected.id === id) setSelected({ ...selected, ...patch });
  }

  function updateSourceVerification(sub: Submission, idx: number, patch: Partial<SourceVerification>) {
    const current = sub.sourceVerification ?? sub.sourceLinks.map(() => ({ verified: false, supportsClaim: false, tier: "C" as const, publisher: "" }));
    const updated = current.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    updateSub(sub.id, { sourceVerification: updated });
  }

  if (loading) return <p className="ds-body empty-text">{t("loading")}</p>;

  return (
    <>
      <div className="ds-h1 mb-24">{t("title")}</div>

      {error && (
        <div className="card empty-state" style={{ color: "var(--danger)" }}>
          <p className="ds-body">{error}</p>
        </div>
      )}

      {!error && submissions.length === 0 ? (
        <div className="card empty-state">
          <p className="ds-body text-fg2">{t("empty")}</p>
        </div>
      ) : (
        <div className="reviewer-grid">
          {submissions.map((s) => {
            const cat = getCategoryConfig(s.reportCategory ?? undefined);
            return (
              <div key={s.id} className="reviewer-card">
                <div className="rc-head">
                  <div>
                    <div className="rc-name">{s.entityName}</div>
                    <div className="rc-meta">
                      {resolveSubTypeLabel(s, tSubmit)} · {resolveCategoryLabel(s, tSubmit)} · <span className="font-semibold">{t("status")}: {getStatusLabel(s.status, t)}</span>
                    </div>
                  </div>
                  <button className="btn primary btn-sm" onClick={() => setSelected(s)}>
                    {locale === "ar" ? "مراجعة" : "Review"}
                  </button>
                </div>
                <div className="rc-desc">{s.allegationDescription}</div>
                <div className="rc-foot">
                  {renderIcon(cat?.iconName, 16)}
                  <span>{resolveCategoryLabel(s, tSubmit)}</span>
                  <span className="dot" />
                  {t("sources")}: {Array.isArray(s.sourceLinks) ? s.sourceLinks.length : 0}
                  <span className="dot" />
                  <span>{t("reviewedBy")}: {s.reviewedByName ?? t("notReviewed")}</span>
                  {s.secondReviewedByName && (
                    <>
                      <span className="dot" />
                      <span>{t("secondReviewedBy")}: {s.secondReviewedByName}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="modal-panel">
            <div className="modal-header">
              <div className="ds-h2">{selected.entityName}</div>
              <button onClick={() => setSelected(null)} className="modal-close">×</button>
            </div>

            <SubmissionMetadata sub={selected} locale={locale} t={tSubmit} />

            {/* Triage Form */}
            <section className="form-section mb-20">
              <div className="form-section-title">
                {locale === "ar" ? "الفلترة المنظمة" : "Structured Triage"}
              </div>

              <label className="form-field flex-between gap-8 mb-8" style={{ fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.triageConfirmedActor ?? false}
                  onChange={(e) => updateSub(selected.id, { triageConfirmedActor: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد هوية الفاعل" : "Actor identity confirmed"}
              </label>

              <label className="form-field flex-between gap-8 mb-8" style={{ fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.triageConfirmedConduct ?? false}
                  onChange={(e) => updateSub(selected.id, { triageConfirmedConduct: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد السلوك المحدد" : "Specific conduct confirmed"}
              </label>

              <label className="form-field flex-between gap-8 mb-8" style={{ fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.identityResolutionConfirmed ?? false}
                  onChange={(e) => updateSub(selected.id, { identityResolutionConfirmed: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد تحليل الهوية" : "Identity resolution confirmed"}
              </label>

              <div className="form-field">
                <label className="block-label mb-4" style={{ fontSize: 14, fontWeight: 600 }}>
                  {locale === "ar" ? "التصنيف" : "Category"}
                </label>
                <input
                  type="text"
                  value={selected.triageCategory ?? ""}
                  onChange={(e) => updateSub(selected.id, { triageCategory: e.target.value })}
                  placeholder={locale === "ar" ? "مثال: انتهاك حقوق الإنسان" : "e.g. Human rights violation"}
                  className="ds-input"
                />
              </div>
            </section>

            {/* Source Verification */}
            <section className="form-section mb-20">
              <div className="form-section-title">
                {locale === "ar" ? "التحقق من المصادر" : "Source Verification"}
              </div>
              {(selected.sourceLinks ?? []).map((link, i) => (
                <div key={i} className="card" style={{ padding: 12, marginBottom: 8 }}>
                  <div className="ds-body-sm" style={{ marginBottom: 8, wordBreak: "break-all" }}>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: "var(--brand)" }}>{link.title || link.url}</a>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selected.sourceVerification?.[i]?.verified ?? false}
                        onChange={(e) => updateSourceVerification(selected, i, { verified: e.target.checked })}
                      />
                      {locale === "ar" ? "موثّق" : "Verified"}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selected.sourceVerification?.[i]?.supportsClaim ?? false}
                        onChange={(e) => updateSourceVerification(selected, i, { supportsClaim: e.target.checked })}
                      />
                      {locale === "ar" ? "يدعم الادعاء" : "Supports claim"}
                    </label>
                    <select
                      value={selected.sourceVerification?.[i]?.tier ?? "C"}
                      onChange={(e) => updateSourceVerification(selected, i, { tier: e.target.value as "A" | "B" | "C" })}
                      className="ds-select"
                      style={{ padding: "4px 8px" }}
                    >
                      <option value="A">{TIER_LABELS[locale as "ar" | "en"]["A"]}</option>
                      <option value="B">{TIER_LABELS[locale as "ar" | "en"]["B"]}</option>
                      <option value="C">{TIER_LABELS[locale as "ar" | "en"]["C"]}</option>
                    </select>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                      {locale === "ar" ? "رابط اللقطة" : "Snapshot URL"}
                    </label>
                    <input
                      type="url"
                      value={selected.sourceVerification?.[i]?.snapshotUrl ?? ""}
                      onChange={(e) => updateSourceVerification(selected, i, { snapshotUrl: e.target.value })}
                      placeholder={locale === "ar" ? "https://web.archive.org/..." : "https://web.archive.org/..."}
                      className="ds-input"
                      style={{ fontSize: 13, padding: "6px 10px" }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Evidence & Privacy */}
            <section className="form-section mb-20">
              <div className="form-section-title">
                {locale === "ar" ? "البوابة القانونية/الأمنية" : "Legal/Safety Gate"}
              </div>

              <div className="form-field">
                <label className="block-label mb-4" style={{ fontSize: 14, fontWeight: 600 }}>
                  {locale === "ar" ? "قوة الأدلة" : "Evidence Strength"}
                </label>
                <select
                  value={selected.evidenceStrength ?? ""}
                  onChange={(e) => updateSub(selected.id, { evidenceStrength: e.target.value })}
                  className="ds-input"
                >
                  <option value="">{locale === "ar" ? "اختر..." : "Select..."}</option>
                  <option value="0">0 — {locale === "ar" ? "قيد المراجعة" : "Under review"}</option>
                  <option value="1">1 — {locale === "ar" ? "موثّق" : "Documented"}</option>
                  <option value="2">2 — {locale === "ar" ? "مؤكد" : "Corroborated"}</option>
                  <option value="3">3 — {locale === "ar" ? "محكمة" : "Court-confirmed"}</option>
                </select>
              </div>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.privacyCheckPassed ?? false}
                  onChange={(e) => updateSub(selected.id, { privacyCheckPassed: e.target.checked })}
                />
                {locale === "ar" ? "تم اجتياز فحص الخصوصية" : "Privacy check passed"}
              </label>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.phrasingApproved ?? false}
                  onChange={(e) => updateSub(selected.id, { phrasingApproved: e.target.checked })}
                />
                {locale === "ar" ? "تمت الموافقة على الصياغة" : "Phrasing approved"}
              </label>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.privacyRechecked ?? false}
                  onChange={(e) => updateSub(selected.id, { privacyRechecked: e.target.checked })}
                />
                {locale === "ar" ? "تم إعادة فحص الخصوصية" : "Privacy rechecked"}
              </label>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.isDeceased ?? false}
                  onChange={(e) => updateSub(selected.id, { isDeceased: e.target.checked })}
                />
                {locale === "ar" ? "المتوفّى" : "Deceased"}
              </label>
            </section>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => saveTriage(selected)}>
                {locale === "ar" ? "حفظ الفلترة" : "Save Triage"}
              </button>

              <button className="btn ghost" onClick={() => exportSubmissionToPDF(selected, locale)}>
                {locale === "ar" ? "تصدير PDF" : "Export PDF"}
              </button>

              {selected.status === "pending" && (
                <button
                  className="btn primary"
                  onClick={() => act(selected.id, "approve")}
                  disabled={!selected.triageConfirmedActor || !selected.triageConfirmedConduct}
                >
                  {locale === "ar" ? "اعتماد (مراجعة أولى)" : "Approve (1st Review)"}
                </button>
              )}

              {selected.status === "verified" && (
                <button
                  className="btn primary"
                  onClick={() => act(selected.id, "second_approve")}
                  disabled={!selected.identityResolutionConfirmed || !selected.evidenceStrength || !selected.privacyCheckPassed || !selected.phrasingApproved || !selected.privacyRechecked}
                >
                  {locale === "ar" ? "اعتماد (مراجعة ثانية)" : "Approve (2nd Review)"}
                </button>
              )}

              {selected.status === "ready_to_publish" && (
                <button
                  className="btn primary"
                  onClick={() => {
                    const hasLawyer = confirm(locale === "ar" ? "هل تم الحصول على موافقة المحامي؟" : "Has lawyer sign-off been obtained?");
                    act(selected.id, "publish", { hasLawyerSignOff: hasLawyer });
                  }}
                >
                  {locale === "ar" ? "نشر" : "Publish"}
                </button>
              )}

              <button className="btn danger" onClick={() => act(selected.id, "reject")}>
                {t("reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
