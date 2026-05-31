"use client";

import type { Entity, Lang } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/labels";
import { EvidenceStrength } from "./EvidenceStrength";
import { StatusBadge } from "./StatusBadge";
import { useTranslations } from "next-intl";

export function EvidenceCard({
  entity,
  lang,
  onOpen,
}: {
  entity: Entity;
  lang: Lang;
  onOpen?: (e: Entity) => void;
}) {
  const labels = useTranslations("labels");
  const a = entity.allegations[0];
  const nSrc = entity.allegations.reduce(
    (n, x) => n + x.sources.length,
    0
  );
  const interactive = typeof onOpen === "function";
  return (
    <article
      className={`card${interactive ? " interactive" : ""}`}
      onClick={interactive ? () => onOpen!(entity) : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
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
        <StatusBadge status={entity.status} lang={lang} />
        <div className="alle">{a.description}</div>
        <div className="srcline">
          <span className="mark">
            {labels("sources")} · {nSrc}
          </span>
          <span className="tiers">
            {a.sources.map((s) => `Tier ${s.tier}`).join(" · ")}
          </span>
        </div>
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
    </article>
  );
}
