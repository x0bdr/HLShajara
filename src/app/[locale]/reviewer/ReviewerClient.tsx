"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

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

interface Submission {
  id: number;
  entityName: string;
  entityType: string;
  entityRole: string;
  allegationDescription: string;
  status: string;
  sourceLinks: SourceLink[];
  createdAt: string;
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
}

export default function ReviewerPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const t = useTranslations("reviewer");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setSubmissions(data.submissions);
      })
      .finally(() => setLoading(false));
  }, []);

  async function act(id: number, action: string, extra?: any) {
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
    const verifications = sub.sourceLinks.map((_, i) => (sub.sourceVerification?.[i] ?? { verified: false, supportsClaim: false, tier: "C", publisher: "" }));
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
      <div className="ds-h1" style={{ marginBottom: 24 }}>{t("title")}</div>

      {submissions.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p className="ds-body" style={{ color: "var(--fg2)" }}>{t("empty")}</p>
        </div>
      ) : (
        <div className="reviewer-grid">
          {submissions.map((s) => (
            <div key={s.id} className="reviewer-card">
              <div className="rc-head">
                <div>
                  <div className="rc-name">{s.entityName}</div>
                  <div className="rc-meta">{s.entityRole} · {s.entityType} · <span style={{ textTransform: "uppercase", fontWeight: 600 }}>{s.status}</span></div>
                </div>
                <button className="btn primary btn-sm" onClick={() => setSelected(s)}>
                  {locale === "ar" ? "مراجعة" : "Review"}
                </button>
              </div>
              <div className="rc-desc">{s.allegationDescription}</div>
              <div className="ds-meta" style={{ marginBottom: 0 }}>
                {t("sources")}: {Array.isArray(s.sourceLinks) ? s.sourceLinks.length : 0}
              </div>
            </div>
          ))}
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

            {/* Triage Form */}
            <section className="form-section" style={{ marginBottom: 20 }}>
              <div className="form-section-title" style={{ fontSize: "var(--text-lg)" }}>
                {locale === "ar" ? "الفلترة المنظمة" : "Structured Triage"}
              </div>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.triageConfirmedActor ?? false}
                  onChange={(e) => updateSub(selected.id, { triageConfirmedActor: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد هوية الفاعل" : "Actor identity confirmed"}
              </label>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.triageConfirmedConduct ?? false}
                  onChange={(e) => updateSub(selected.id, { triageConfirmedConduct: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد السلوك المحدد" : "Specific conduct confirmed"}
              </label>

              <label className="form-field" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selected.identityResolutionConfirmed ?? false}
                  onChange={(e) => updateSub(selected.id, { identityResolutionConfirmed: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد تحليل الهوية" : "Identity resolution confirmed"}
              </label>

              <div className="form-field">
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>
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
            <section className="form-section" style={{ marginBottom: 20 }}>
              <div className="form-section-title" style={{ fontSize: "var(--text-lg)" }}>
                {locale === "ar" ? "التحقق من المصادر" : "Source Verification"}
              </div>
              {(selected.sourceLinks ?? []).map((link, i) => (
                <div key={i} className="card" style={{ padding: 12, marginBottom: 8 }}>
                  <div className="ds-body-sm" style={{ marginBottom: 8, wordBreak: "break-all" }}>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{link.title || link.url}</a>
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
                      <option value="A">Tier A</option>
                      <option value="B">Tier B</option>
                      <option value="C">Tier C</option>
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
            <section className="form-section" style={{ marginBottom: 20 }}>
              <div className="form-section-title" style={{ fontSize: "var(--text-lg)" }}>
                {locale === "ar" ? "البوابة القانونية/الأمنية" : "Legal/Safety Gate"}
              </div>

              <div className="form-field">
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>
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
