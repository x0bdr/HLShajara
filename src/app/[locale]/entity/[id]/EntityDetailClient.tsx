"use client";

import { useEffect, useState } from "react";
import { EvidenceStrength, StatusBadge, LegalNote } from "@/components";
import { TYPE_LABELS } from "@/lib/labels";
import type { Entity } from "@/lib/types";

export default function EntityDetailClient({ id }: { id: string }) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const lang = "ar" as const;

  useEffect(() => {
    if (!id) return;
    fetch(`/HLShajara/api/entity?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntity(data.entity);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main style={{ maxWidth: 920, margin: "0 auto", padding: 32 }}>
        <p className="ds-body" style={{ textAlign: "center" }}>جارِ التحميل...</p>
      </main>
    );
  }

  if (!entity) {
    return (
      <main style={{ maxWidth: 920, margin: "0 auto", padding: 32 }}>
        <p className="ds-body" style={{ textAlign: "center" }}>المدخل غير موجود.</p>
      </main>
    );
  }

  const a = entity.allegations[0];

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px" }}>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="top">
          <div className="ttl">
            <div className="name">{entity.name}</div>
            <div className="role">
              {entity.role} · {TYPE_LABELS[lang][entity.type]}
            </div>
            <div className="id">{entity.id}</div>
          </div>
          <EvidenceStrength level={entity.evidence} lang={lang} />
        </div>
        <div className="body">
          <div style={{ marginBottom: 9 }}>
            <StatusBadge status={entity.status} lang={lang} />
          </div>
          {a && (
            <>
              <div className="alle">{a.description}</div>
              <div className="srcline">
                <span className="mark">المصادر · {a.sources?.length ?? 0}</span>
                <span className="tiers">
                  {a.sources?.map((s) => `Tier ${s.tier}`).join(" · ")}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="foot">
          <span className="reply">
            حق الرد: {entity.rightOfReply === "none"
              ? "جهة الاتصال مسجّلة · لم يُقدَّم بيان"
              : "يوجد بيان"}
          </span>
          <span className="ver">v{entity.version} · مُدقّق</span>
        </div>
      </div>

      <LegalNote lang={lang}>
        بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
        هذا المحتوى يعبّر عن رأي سياسي.
      </LegalNote>
    </main>
  );
}
