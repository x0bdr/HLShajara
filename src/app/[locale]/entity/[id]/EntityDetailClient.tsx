"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { EvidenceStrength, StatusBadge, LegalNote, SkeletonCard } from "@/components";
import { TYPE_LABELS, STATUS_LABELS, EVIDENCE_LABELS } from "@/lib/labels";
import type { Entity, Lang } from "@/lib/types";

export default function EntityDetailClient({ id }: { id: string }) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("entity");
  const labels = useTranslations("labels");
  const legal = useTranslations("legal");
  const locale = useLocale();
  const lang = locale as Lang;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/entity?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntity(data.entity);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <SkeletonCard />
        <div style={{ marginTop: 16 }}>
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (!entity) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <p className="ds-body" style={{ color: "var(--fg2)" }}>{t("notFound")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Case File Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div className="ds-h1" style={{ marginBottom: 6, lineHeight: 1.2 }}>
                {entity.name}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg2)" }}>
                {entity.role} · {TYPE_LABELS[lang][entity.type]}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)", marginTop: 8 }}>
                {entity.id}
              </div>
            </div>
            <EvidenceStrength level={entity.evidence} lang={lang} />
          </div>

          <div className="meta-grid">
            <div className="meta-item">
              <div className="meta-label">{lang === "ar" ? "الحالة" : "Status"}</div>
              <div className="meta-value"><StatusBadge status={entity.status} lang={lang} /></div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{lang === "ar" ? "الأدلة" : "Evidence"}</div>
              <div className="meta-value">{EVIDENCE_LABELS[lang][entity.evidence]}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{lang === "ar" ? "الإصدار" : "Version"}</div>
              <div className="meta-value">v{entity.version}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{labels("reply")}</div>
              <div className="meta-value">
                {entity.rightOfReply === "none" ? labels("replyNone") : labels("replyFiled")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allegations */}
      {entity.allegations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="ds-h3" style={{ marginBottom: 14, paddingInline: 4 }}>
            {locale === "ar" ? "الادّعاءات" : "Allegations"}
          </div>
          {entity.allegations.map((a, i) => (
            <AllegationCard key={i} allegation={a} index={i} lang={lang} />
          ))}
        </div>
      )}

      <LegalNote lang={lang}>{legal("note")}</LegalNote>
    </>
  );
}

function AllegationCard({ allegation, index, lang }: { allegation: Entity["allegations"][0]; index: number; lang: Lang }) {
  return (
    <div className="allegation-card">
      <div className="alle-header">
        <span className="mark">#{index + 1}</span>
        {allegation.classification && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fg2)" }}>
            {allegation.classification}
          </span>
        )}
      </div>
      <div className="alle-desc">{allegation.description}</div>
      <div className="alle-meta">
        {allegation.period && <span>{allegation.period}</span>}
        {allegation.location && <span>{allegation.location}</span>}
        <span>{allegation.sources.length} {lang === "ar" ? "مصدر" : "source"}{allegation.sources.length !== 1 ? (lang === "ar" ? "ات" : "s") : ""}</span>
      </div>
      {allegation.sources.length > 0 && (
        <div className="alle-sources">
          <div className="alle-sources-title">{lang === "ar" ? "المصادر" : "Sources"}</div>
          {allegation.sources.map((s, j) => (
            <div key={j} className="cite" style={{ marginBottom: 10 }}>
              <span className="mark">Tier {s.tier}</span>
              <div>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="ctxt" style={{ color: "var(--brand)", textDecoration: "none", borderBottom: "1px solid var(--green-200)" }}>
                    {s.title}
                  </a>
                ) : (
                  <div className="ctxt">{s.title}</div>
                )}
                <div className="meta">{s.publisher}{s.date ? ` · ${s.date}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
