import type { EntityStatus, Lang } from '@/lib/types';
import { STATUS_LABELS, STATUS_VAR } from '@/lib/labels';

/** Legal-process status — conduct, never identity. Muted dot + label. */
export function StatusBadge({ status, lang }: { status: EntityStatus; lang: Lang }) {
  return (
    <span className="status" style={{ color: `var(${STATUS_VAR[status]})` }}>
      <span className="d" aria-hidden />
      {STATUS_LABELS[lang][status]}
    </span>
  );
}
