import type { EvidenceLevel, Lang } from '@/lib/types';
import { EVIDENCE_LABELS } from '@/lib/labels';

/**
 * Evidence-strength label. The single brass accent intensifies up the ladder;
 * the strongest rung (4 · Court-confirmed) is institutional green.
 */
export function EvidenceStrength({ level, lang }: { level: EvidenceLevel; lang: Lang }) {
  return (
    <span className={`ev e${level}`}>
      <span className="dot" aria-hidden />
      {EVIDENCE_LABELS[lang][level]}
    </span>
  );
}
