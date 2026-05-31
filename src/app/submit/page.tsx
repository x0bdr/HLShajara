"use client";

import { useState } from "react";
import { Button, LegalNote } from "@/components";

export default function SubmitPage() {
  const [form, setForm] = useState({
    entityName: "",
    entityType: "individual",
    entityRole: "",
    allegationDescription: "",
    allegationPeriod: "",
    allegationLocation: "",
    allegationClassification: "",
    sourceLinks: [{ url: "", title: "" }],
    submitterEmail: "",
    submitterName: "",
    isAnonymous: false,
  });
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    code?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lang = "ar" as const;

  function updateField<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateLink(index: number, field: "url" | "title", value: string) {
    setForm((f) => {
      const links = [...f.sourceLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...f, sourceLinks: links };
    });
  }

  function addLink() {
    setForm((f) => ({ ...f, sourceLinks: [...f.sourceLinks, { url: "", title: "" }] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const res = await fetch("/HLShajara/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setResult(data);
    setSubmitting(false);

    if (data.ok) {
      setForm({
        entityName: "",
        entityType: "individual",
        entityRole: "",
        allegationDescription: "",
        allegationPeriod: "",
        allegationLocation: "",
        allegationClassification: "",
        sourceLinks: [{ url: "", title: "" }],
        submitterEmail: "",
        submitterName: "",
        isAnonymous: false,
      });
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--fg1)",
    fontFamily: "var(--font-sans)",
    fontSize: 14,
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 8 }}>تقديم بلاغ</div>
      <p className="ds-lead" style={{ marginBottom: 24 }}>
        قدّم معلومات موثَّقة عن فرد أو جهة محدّدة. كل بلاغ يمرّ بفلترة آلية
        ومراجعة بشرية مزدوجة.
      </p>

      <LegalNote lang={lang}>
        بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
        هذا المحتوى يعبّر عن رأي سياسي.
      </LegalNote>

      {result && (
        <div
          className="legal"
          style={{
            marginTop: 16,
            marginBottom: 16,
            borderColor: result.ok ? "var(--green-500)" : "var(--brick-500)",
            background: result.ok ? "var(--green-50)" : "var(--brick-100)",
          }}
        >
          <div className="t" style={{ color: result.ok ? "var(--green-700)" : "var(--brick-700)" }}>
            {result.ok ? "تم الإرسال" : "خطأ"}
          </div>
          <p>{result.message}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div className="ds-h3">عن الجهة</div>

        <div>
          <label className="ds-caption">الاسم الكامل</label>
          <input
            type="text"
            value={form.entityName}
            onChange={(e) => updateField("entityName", e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label className="ds-caption">النوع</label>
          <select
            value={form.entityType}
            onChange={(e) => updateField("entityType", e.target.value)}
            style={inputStyle}
          >
            <option value="individual">فرد</option>
            <option value="organization">منظمة</option>
            <option value="military_unit">وحدة عسكرية</option>
            <option value="security_branch">فرع أمن</option>
            <option value="official_body">جهة رسمية</option>
          </select>
        </div>

        <div>
          <label className="ds-caption">الدور / المنصب</label>
          <input
            type="text"
            value={form.entityRole}
            onChange={(e) => updateField("entityRole", e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div className="ds-h3" style={{ marginTop: 8 }}>عن الادّعاء</div>

        <div>
          <label className="ds-caption">وصف التورط</label>
          <textarea
            value={form.allegationDescription}
            onChange={(e) => updateField("allegationDescription", e.target.value)}
            required
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="ds-caption">الفترة الزمنية</label>
            <input
              type="text"
              value={form.allegationPeriod}
              onChange={(e) => updateField("allegationPeriod", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="ds-caption">الموقع</label>
            <input
              type="text"
              value={form.allegationLocation}
              onChange={(e) => updateField("allegationLocation", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div className="ds-h3" style={{ marginTop: 8 }}>المصادر</div>
        {form.sourceLinks.map((link, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input
              type="url"
              placeholder="رابط المصدر"
              value={link.url}
              onChange={(e) => updateLink(i, "url", e.target.value)}
              required
              style={{ ...inputStyle, flex: 2 }}
            />
            <input
              type="text"
              placeholder="عنوان المصدر (اختياري)"
              value={link.title}
              onChange={(e) => updateLink(i, "title", e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        ))}
        <button type="button" onClick={addLink} className="btn ghost" style={{ alignSelf: "flex-start" }}>
          + إضافة مصدر
        </button>

        <div className="ds-h3" style={{ marginTop: 8 }}>معلومات المُبلِّغ (اختياري)</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="ds-caption">البريد الإلكتروني</label>
            <input
              type="email"
              value={form.submitterEmail}
              onChange={(e) => updateField("submitterEmail", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="ds-caption">الاسم</label>
            <input
              type="text"
              value={form.submitterName}
              onChange={(e) => updateField("submitterName", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => updateField("isAnonymous", e.target.checked)}
          />
          <span className="ds-body-sm">تقديم بشكل مجهول</span>
        </label>

        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "جارِ الإرسال..." : "إرسال البلاغ"}
        </Button>
      </form>
    </main>
  );
}
