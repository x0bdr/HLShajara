"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

interface Reply {
  id: number;
  entityName: string;
  email: string;
  statement: string;
  status: string;
  createdAt: string;
}

export default function RepliesAdminClient() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reply | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [notes, setNotes] = useState("");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/reply/admin")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setReplies(data.replies);
      })
      .finally(() => setLoading(false));
  }, []);

  async function act(replyId: number, action: string, extra?: any) {
    const res = await fetch("/api/reply/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, replyId, notes, ...extra }),
    });
    const data = await res.json();
    if (!data.ok) {
      alert(data.message || "Action failed");
      return;
    }
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    setSelected(null);
    setNotes("");
    setCorrectionText("");
  }

  if (loading) return <p className="ds-body empty-text">Loading...</p>;

  return (
    <>
      <div className="ds-h1" style={{ marginBottom: 24 }}>
        {locale === "ar" ? "إدارة ردود الجهات" : "Reply Administration"}
      </div>

      {replies.length === 0 ? (
        <p className="ds-body" style={{ color: "var(--fg2)" }}>
          {locale === "ar" ? "لا توجد ردود قيد الانتظار." : "No pending replies."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {replies.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {r.entityName}
              </div>
              <div className="ds-caption" style={{ marginBottom: 8 }}>{r.email}</div>
              <p className="ds-body-sm" style={{ marginBottom: 12 }}>{r.statement}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="ds-btn-primary" onClick={() => setSelected(r)}>
                  {locale === "ar" ? "معالجة" : "Process"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="ds-h2">{selected.entityName}</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--fg1)" }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>{locale === "ar" ? "البيان:" : "Statement:"}</strong>
              <p className="ds-body-sm" style={{ marginTop: 8 }}>{selected.statement}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>{locale === "ar" ? "ملاحظات الإدارة:" : "Admin Notes:"}</strong>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", marginTop: 8, borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg1)", minHeight: 80 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>{locale === "ar" ? "نص التصحيح (للإجراء 'تصحيح'):" : "Correction Text (for 'correct' action):"}</strong>
              <textarea
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", marginTop: 8, borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg1)", minHeight: 80 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="ds-btn-primary" onClick={() => act(selected.id, "approve")}>
                {locale === "ar" ? "اعتماد" : "Approve"}
              </button>
              <button className="ds-btn-primary" onClick={() => act(selected.id, "correct", { correctionText })}>
                {locale === "ar" ? "تصحيح" : "Correct"}
              </button>
              <button className="ds-btn-danger" onClick={() => act(selected.id, "reject")}>
                {locale === "ar" ? "رفض" : "Reject"}
              </button>
              <button className="ds-btn-danger" onClick={() => act(selected.id, "unpublish")}>
                {locale === "ar" ? "إلغاء النشر" : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
