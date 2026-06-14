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
  nearestLocation?: string;
  contactPhone?: string;
  websiteName?: string;
  googleMapsLink?: string;
  socialMediaAccounts?: string;
}

interface Submission {
  id: number;
  entityName: string;
  entityType: string;
  entityRole: string;
  allegationDescription: string;
  status: string;
  sourceLinks: SourceLink[];
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
  receptionInfo: "استقبال / مكتب أمامي",
  labourInfo: "عمال / موظفون",
  supportDataInfo: "بيانات داعمة",
  clubName: "اسم النادي / الجمعية",
  country: "الدولة",
  city: "المحافظة / المدينة",
  nearestLocation: "أقرب نقطة / منطقة",
  contactPhone: "رقم تواصل",
  websiteName: "الموقع / المتجر",
  googleMapsLink: "رابط Google Maps",
  socialMediaAccounts: "حسابات التواصل",
};

const METADATA_LABELS_EN: Record<string, string> = {
  orgSubTypeOther: "Other type (specified)",
  ownerName: "Owner / partners",
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
  receptionInfo: "Reception / front desk",
  labourInfo: "Labour / employees",
  supportDataInfo: "Supportive data",
  clubName: "Club / association name",
  country: "Country",
  city: "State / City",
  nearestLocation: "Nearest point / area",
  contactPhone: "Contact number",
  websiteName: "Website / e-shop",
  googleMapsLink: "Google Maps link",
  socialMediaAccounts: "Social accounts",
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
        return <MetadataRow key={key} label={label} value={value} />;
      })}
    </section>
  );
}

export default function ReviewerPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const t = useTranslations("reviewer");
  const tSubmit = useTranslations("submit");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setSubmissions(data.submissions);
      })
      .finally(() => setLoading(false));
  }, []);

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

      {submissions.length === 0 ? (
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
