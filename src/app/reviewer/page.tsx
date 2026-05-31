"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components";

interface Submission {
  id: number;
  entityName: string;
  entityType: string;
  entityRole: string;
  allegationDescription: string;
  status: string;
  sourceLinks: { url: string; title?: string }[];
  createdAt: string;
}

export default function ReviewerPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/HLShajara/api/review")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setSubmissions(data.submissions);
      })
      .finally(() => setLoading(false));
  }, []);

  async function act(id: number, action: "approve" | "reject") {
    await fetch("/HLShajara/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, submissionId: id, reviewerId: 1, reviewerRole: "reviewer" }),
    });
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 24 }}>لوحة المراجعة</div>

      {loading ? (
        <p className="ds-body">جارِ التحميل...</p>
      ) : submissions.length === 0 ? (
        <p className="ds-body" style={{ color: "var(--fg2)" }}>
          لا توجد طلبات مراجعة معلّقة.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {submissions.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{ padding: 16 }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {s.entityName}
              </div>
              <div className="ds-caption" style={{ marginBottom: 8 }}>
                {s.entityRole} · {s.entityType}
              </div>
              <p className="ds-body-sm" style={{ marginBottom: 12 }}>
                {s.allegationDescription}
              </p>
              <div className="ds-meta" style={{ marginBottom: 12 }}>
                المصادر: {Array.isArray(s.sourceLinks) ? s.sourceLinks.length : 0}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" onClick={() => act(s.id, "approve")}>
                  موافقة
                </Button>
                <Button variant="danger" onClick={() => act(s.id, "reject")}>
                  رفض
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
