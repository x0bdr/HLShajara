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
      {replies.length === 0 ? (
        <div className="card empty-state">
          <p className="ds-body text-fg2">
            {locale === "ar" ? "لا توجد ردود قيد الانتظار." : "No pending replies."}
          </p>
        </div>
      ) : (
        <div className="reviewer-grid">
          {replies.map((r) => (
            <div key={r.id} className="reviewer-card">
              <div className="rc-head">
                <div>
                  <div className="rc-name">{r.entityName}</div>
                  <div className="rc-meta">{r.email}</div>
                </div>
                <button className="btn primary btn-sm" onClick={() => setSelected(r)}>
                  {locale === "ar" ? "معالجة" : "Process"}
                </button>
              </div>
              <p className="rc-desc">{r.statement}</p>
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

            <div style={{ marginBottom: 16 }}>
              <strong>{locale === "ar" ? "البيان:" : "Statement:"}</strong>
              <p className="ds-body-sm" style={{ marginTop: 8 }}>{selected.statement}</p>
            </div>

            <div className="form-field" style={{ marginBottom: 16 }}>
              <label>{locale === "ar" ? "ملاحظات الإدارة:" : "Admin Notes:"}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="ds-input"
                style={{ minHeight: 80 }}
              />
            </div>

            <div className="form-field" style={{ marginBottom: 16 }}>
              <label>{locale === "ar" ? "نص التصحيح:" : "Correction Text:"}</label>
              <textarea
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                className="ds-input"
                style={{ minHeight: 80 }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={() => act(selected.id, "approve")}>
                {locale === "ar" ? "اعتماد" : "Approve"}
              </button>
              <button className="btn primary" onClick={() => act(selected.id, "correct", { correctionText })}>
                {locale === "ar" ? "تصحيح" : "Correct"}
              </button>
              <button className="btn danger" onClick={() => act(selected.id, "reject")}>
                {locale === "ar" ? "رفض" : "Reject"}
              </button>
              <button className="btn danger" onClick={() => act(selected.id, "unpublish")}>
                {locale === "ar" ? "إلغاء النشر" : "Unpublish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
