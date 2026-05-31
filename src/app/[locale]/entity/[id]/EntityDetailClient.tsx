"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { EvidenceStrength, StatusBadge, LegalNote, SkeletonCard } from "@/components";
import { TYPE_LABELS } from "@/lib/labels";
import type { Entity } from "@/lib/types";

export default function EntityDetailClient({ id }: { id: string }) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("entity");
  const labels = useTranslations("labels");
  const legal = useTranslations("legal");
  const locale = useLocale();
  const lang = locale as "ar" | "en";

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
        <SkeletonCard />
      </>
    );
  }

  if (!entity) {
    return (
      <p className="ds-body empty-text">{t("notFound")}</p>
    );
  }

  const a = entity.allegations[0];

  return (
    <>
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
                <span className="mark">
                  {labels("sources")} · {a.sources?.length ?? 0}
                </span>
                <span className="tiers">
                  {a.sources?.map((s) => `Tier ${s.tier}`).join(" · ")}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="foot">
          <span className="reply">
            {labels("reply")}:{" "}
            {entity.rightOfReply === "none"
              ? labels("replyNone")
              : labels("replyFiled")}
          </span>
          <span className="ver">
            {labels("version", {
              version: entity.version,
              audited: labels("audited"),
            })}
          </span>
        </div>
      </div>

      <LegalNote lang={lang}>{legal("note")}</LegalNote>
    </>
  );
}
