import type { Lang } from '@/lib/types';

const TITLE: Record<Lang, string> = { en: 'Legal note', ar: 'ملاحظة قانونية' };

/** Recurring legal-note banner. Pass project copy as children or use the default. */
export function LegalNote({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <aside className="legal" role="note">
      <div className="t">{TITLE[lang]}</div>
      <p>{children}</p>
    </aside>
  );
}
