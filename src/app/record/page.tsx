"use client";

import { useEffect, useState } from "react";
import { EvidenceCard, LegalNote } from "@/components";
import type { Entity } from "@/lib/types";

export default function RecordPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const lang = "ar" as const;

  useEffect(() => {
    fetch("/HLShajara/api/entity")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntities(data.entities);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = entities.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="ds-h1" style={{ marginBottom: 8 }}>السجلّ العام</div>
        <p className="ds-lead">
          السجلّ الموثَّق للجهات والأفراد المرتبطين بجرائم محدّدة في سوريا.
        </p>
      </header>

      <div style={{ marginBottom: 24 }}>
        <LegalNote lang={lang}>
          بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
          هذا المحتوى يعبّر عن رأي سياسي.
        </LegalNote>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="ابحث باسم الجهة..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--fg1)",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
          }}
        />
      </div>

      {loading ? (
        <p className="ds-body" style={{ textAlign: "center" }}>جارِ التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="ds-body" style={{ textAlign: "center", color: "var(--fg2)" }}>
          لا توجد مدخلات بعد.
        </p>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filtered.map((e) => (
            <EvidenceCard key={e.id} entity={e} lang={lang} />
          ))}
        </section>
      )}
    </main>
  );
}
