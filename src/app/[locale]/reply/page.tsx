"use client";

import { useState } from "react";
import { Button, LegalNote } from "@/components";

export default function ReplyPage() {
  const [entityName, setEntityName] = useState("");
  const [email, setEmail] = useState("");
  const [statement, setStatement] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const lang = "ar" as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In a real implementation, this would POST to an API
    setSubmitted(true);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 8 }}>حق الرد</div>
      <p className="ds-lead" style={{ marginBottom: 24 }}>
        إذا كنت مدرجًا في هذا السجلّ وترغب في تقديم بيان أو تصحيح، يمكنك استخدام النموذج أدناه.
      </p>

      <LegalNote lang={lang}>
        بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
        هذا المحتوى يعبّر عن رأي سياسي.
      </LegalNote>

      {submitted ? (
        <div
          className="legal"
          style={{ marginTop: 24, borderColor: "var(--green-500)", background: "var(--green-50)" }}
        >
          <div className="t" style={{ color: "var(--green-700)" }}>تم الإرسال</div>
          <p>تم استلام بيانك وسيتم مراجعته من قبل الفريق القانوني.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="ds-caption">الاسم كما ورد في السجلّ</label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                marginTop: 4,
              }}
            />
          </div>
          <div>
            <label className="ds-caption">البريد الإلكتروني للتواصل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                marginTop: 4,
              }}
            />
          </div>
          <div>
            <label className="ds-caption">البيان / التصحيح</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              required
              rows={6}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg1)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                marginTop: 4,
                resize: "vertical",
              }}
            />
          </div>
          <Button variant="primary" type="submit">إرسال البيان</Button>
        </form>
      )}
    </main>
  );
}
