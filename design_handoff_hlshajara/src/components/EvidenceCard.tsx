'use client';

import type { Entity, Lang } from '@/lib/types';
import { TYPE_LABELS } from '@/lib/labels';
import { EvidenceStrength } from './EvidenceStrength';
import { StatusBadge } from './StatusBadge';

const SOURCES_LABEL: Record<Lang, string> = { en: 'Sources', ar: 'المصادر' };
const REPLY_LABEL: Record<Lang, string> = { en: 'Right of reply', ar: 'حق الرد' };
const REPLY_STATE: Record<Lang, { none: string; filed: string }> = {
  en: { none: 'contact recorded · no statement filed', filed: 'statement on file' },
  ar: { none: 'جهة الاتصال مسجّلة · لم يُقدَّم بيان', filed: 'يوجد بيان' },
};
const AUDITED: Record<Lang, string> = { en: 'audited', ar: 'مُدقّق' };

/**
 * The signature evidence card. Presentational — pass an Entity and a lang.
 * `onOpen` makes it an interactive (clickable) card; omit for a static view.
 */
export function EvidenceCard({
  entity,
  lang,
  onOpen,
}: {
  entity: Entity;
  lang: Lang;
  onOpen?: (e: Entity) => void;
}) {
  const a = entity.allegations[0];
  const nSrc = entity.allegations.reduce((n, x) => n + x.sources.length, 0);
  const interactive = typeof onOpen === 'function';

  return (
    <article
      className={`card${interactive ? ' interactive' : ''}`}
      onClick={interactive ? () => onOpen!(entity) : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen!(entity);
              }
            }
          : undefined
      }
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
        <div style={{ marginBottom: 9 }}>
          <StatusBadge status={entity.status} lang={lang} />
        </div>
        <div className="alle">{a.description}</div>
        <div className="srcline">
          <span className="mark">
            {SOURCES_LABEL[lang]} · {nSrc}
          </span>
          <span className="tiers">{a.sources.map((s) => `Tier ${s.tier}`).join(' · ')}</span>
        </div>
      </div>

      <div className="foot">
        <span className="reply">
          {REPLY_LABEL[lang]}: {REPLY_STATE[lang][entity.rightOfReply]}
        </span>
        <span className="ver">
          v{entity.version} · {AUDITED[lang]}
        </span>
      </div>
    </article>
  );
}
