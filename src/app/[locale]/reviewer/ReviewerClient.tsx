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

  if (loading) return <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}><p className="ds-body">{t("loading")}</p></main>;

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 24 }}>{t("title")}</div>

      {submissions.length === 0 ? (
        <p className="ds-body" style={{ color: "var(--fg2)" }}>{t("empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {submissions.map((s) => (
            <div key={s.id} className="card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {s.entityName}
              </div>
              <div className="ds-caption" style={{ marginBottom: 8 }}>
                {s.entityRole} · {s.entityType} · <span style={{ textTransform: "uppercase", fontWeight: 600 }}>{s.status}</span>
              </div>
              <p className="ds-body-sm" style={{ marginBottom: 12 }}>{s.allegationDescription}</p>
              <div className="ds-meta" style={{ marginBottom: 12 }}>
                {t("sources")}: {Array.isArray(s.sourceLinks) ? s.sourceLinks.length : 0}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="ds-btn-primary" onClick={() => setSelected(s)}>
                  {locale === "ar" ? "مراجعة مفصّلة" : "Detailed Review"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="ds-h2">{selected.entityName}</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--fg1)" }}>×</button>
            </div>

            {/* Triage Form */}
            <section style={{ marginBottom: 24 }}>
              <div className="ds-h3" style={{ marginBottom: 12 }}>{locale === "ar" ? "الفلترة المنظمة" : "Structured Triage"}</div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={selected.triageConfirmedActor ?? false}
                  onChange={(e) => updateSub(selected.id, { triageConfirmedActor: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد هوية الفاعل" : "Actor identity confirmed"}
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={selected.triageConfirmedConduct ?? false}
                  onChange={(e) => updateSub(selected.id, { triageConfirmedConduct: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد السلوك المحدد" : "Specific conduct confirmed"}
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={selected.identityResolutionConfirmed ?? false}
                  onChange={(e) => updateSub(selected.id, { identityResolutionConfirmed: e.target.checked })}
                />
                {locale === "ar" ? "تم تأكيد تحليل الهوية" : "Identity resolution confirmed"}
              </label>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>
                  {locale === "ar" ? "التصنيف" : "Category"}
                </label>
                <input
                  type="text"
                  value={selected.triageCategory ?? ""}
                  onChange={(e) => updateSub(selected.id, { triageCategory: e.target.value })}
                  placeholder={locale === "ar" ? "مثال: انتهاك حقوق الإنسان" : "e.g. Human rights violation"}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg1)" }}
                />
              </div>
            </section>

            {/* Source Verification */}
            <section style={{ marginBottom: 24 }}>
              <div className="ds-h3" style={{ marginBottom: 12 }}>{locale === "ar" ? "التحقق من المصادر" : "Source Verification"}</div>
              {(selected.sourceLinks ?? []).map((link, i) => (
                <div key={i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 8 }}>
                  <div className="ds-body-sm" style={{ marginBottom: 8, wordBreak: "break-all" }}>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{link.title || link.url}</a>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={selected.sourceVerification?.[i]?.verified ?? false}
                        onChange={(e) => updateSourceVerification(selected, i, { verified: e.target.checked })}
                      />
                      {locale === "ar" ? "موثّق" : "Verified"}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
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
                      style={{ padding: "4px 8px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg1)" }}
                    >
                      <option value="A">Tier A</option>
                      <option value="B">Tier B</option>
                      <option value="C">Tier C</option>
                    </select>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                      {locale === "ar" ? "رابط اللقطة (Snapshot)" : "Snapshot URL"}
                    </label>
                    <input
                      type="url"
                      value={selected.sourceVerification?.[i]?.snapshotUrl ?? ""}
                      onChange={(e) => updateSourceVerification(selected, i, { snapshotUrl: e.target.value })}
                      placeholder={locale === "ar" ? "https://web.archive.org/..." : "https://web.archive.org/..."}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg1)", fontSize: 13 }}
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Evidence & Privacy */}
            <section style={{ marginBottom: 24 }}>
              <div className="ds-h3" style={{ marginBottom: 12 }}>{locale === "ar" ? "البوابة القانونية/الأمنية" : "Legal/Safety Gate"}</div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>
                  {locale === "ar" ? "قوة الأدلة" : "Evidence Strength"}
                </label>
                <select
                  value={selected.evidenceStrength ?? ""}
                  onChange={(e) => updateSub(selected.id, { evidenceStrength: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg1)" }}
                >
                  <option value="">{locale === "ar" ? "اختر..." : "Select..."}</option>
                  <option value="0">0 — {locale === "ar" ? "قيد المراجعة" : "Under review"}</option>
                  <option value="1">1 — {locale === "ar" ? "موثّق" : "Documented"}</option>
                  <option value="2">2 — {locale === "ar" ? "مؤكد" : "Corroborated"}</option>
                  <option value="3">3 — {locale === "ar" ? "محكمة" : "Court-confirmed"}</option>
                </select>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={selected.privacyCheckPassed ?? false}
                  onChange={(e) => updateSub(selected.id, { privacyCheckPassed: e.target.checked })}
                />
                {locale === "ar" ? "تم اجتياز فحص الخصوصية" : "Privacy check passed"}
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={selected.phrasingApproved ?? false}
                  onChange={(e) => updateSub(selected.id, { phrasingApproved: e.target.checked })}
                />
                {locale === "ar" ? "تمت الموافقة على الصياغة" : "Phrasing approved"}
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={selected.privacyRechecked ?? false}
                  onChange={(e) => updateSub(selected.id, { privacyRechecked: e.target.checked })}
                />
                {locale === "ar" ? "تم إعادة فحص الخصوصية" : "Privacy rechecked"}
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
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
              <button className="ds-btn-primary" onClick={() => saveTriage(selected)}>
                {locale === "ar" ? "حفظ الفلترة" : "Save Triage"}
              </button>

              {selected.status === "pending" && (
                <button
                  className="ds-btn-primary"
                  onClick={() => act(selected.id, "approve")}
                  disabled={!selected.triageConfirmedActor || !selected.triageConfirmedConduct}
                >
                  {locale === "ar" ? "اعتماد (مراجعة أولى)" : "Approve (1st Review)"}
                </button>
              )}

              {selected.status === "verified" && (
                <button
                  className="ds-btn-primary"
                  onClick={() => act(selected.id, "second_approve")}
                  disabled={!selected.identityResolutionConfirmed || !selected.evidenceStrength || !selected.privacyCheckPassed || !selected.phrasingApproved || !selected.privacyRechecked}
                >
                  {locale === "ar" ? "اعتماد (مراجعة ثانية)" : "Approve (2nd Review)"}
                </button>
              )}

              {selected.status === "ready_to_publish" && (
                <button
                  className="ds-btn-primary"
                  onClick={() => {
                    const hasLawyer = confirm(locale === "ar" ? "هل تم الحصول على موافقة المحامي؟" : "Has lawyer sign-off been obtained?");
                    act(selected.id, "publish", { hasLawyerSignOff: hasLawyer });
                  }}
                >
                  {locale === "ar" ? "نشر" : "Publish"}
                </button>
              )}

              <button className="ds-btn-danger" onClick={() => act(selected.id, "reject")}>
                {t("reject")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
