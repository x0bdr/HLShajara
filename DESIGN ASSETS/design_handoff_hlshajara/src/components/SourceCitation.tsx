import type { Lang, Source } from '@/lib/types';

/** A single source citation with its tier mark. "No source, no publication." */
export function SourceCitation({ source, lang }: { source: Source; lang: Lang }) {
  return (
    <div className="cite">
      <span className="mark">Tier {source.tier}</span>
      <div>
        <div className="ctxt">
          {source.title}
          {source.ref ? (
            <>
              {' — '}
              <a href={source.url ?? '#'} target={source.url ? '_blank' : undefined} rel="noreferrer">
                {source.ref}
              </a>
            </>
          ) : null}
        </div>
        <div className="meta">
          {source.publisher} · {source.date}
        </div>
      </div>
    </div>
  );
}
