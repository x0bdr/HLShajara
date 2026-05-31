'use client';

import { EvidenceCard, LegalNote, Button } from '@/components';
import { SourceCitation } from '@/components';
import type { Entity, Lang } from '@/lib/types';

/** Demo data — names withheld behind brackets, as before the legal gate. */
const SAMPLE: Entity = {
  id: 'ENT-2024-0117',
  type: 'official_body',
  name: '[Named Official]',
  role: 'Commanding role · detention facility',
  status: 'convicted',
  evidence: 4,
  version: 3,
  rightOfReply: 'none',
  allegations: [
    {
      description:
        'Command responsibility over unlawful detention and torture at a named facility.',
      period: '2012–2014',
      location: 'Damascus',
      classification: 'Crimes against humanity (alleged framework)',
      sources: [
        { tier: 'A', title: 'National court judgment, case no. […]', publisher: 'Court record', date: '2022' },
        { tier: 'A', title: 'UN Commission of Inquiry report', publisher: 'UN HRC', date: '2021', ref: 'A/HRC/…' },
      ],
    },
  ],
};

export default function ExamplePage({ lang = 'en' as Lang }) {
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32, display: 'grid', gap: 24 }}>
      <LegalNote lang={lang}>
        This content expresses a political opinion within the scope of freedom of expression under the
        interim Constitutional Declaration. It is not legal advice.
      </LegalNote>

      <h1 className="ds-h1">An archive of record</h1>
      <p className="ds-lead">Evidence over allegation · conduct, not identity · no source, no publication.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <EvidenceCard entity={SAMPLE} lang={lang} onOpen={(e) => console.log('open', e.id)} />
        <EvidenceCard entity={{ ...SAMPLE, id: 'ENT-2024-0203', evidence: 3, status: 'sanctioned' }} lang={lang} />
      </div>

      <section style={{ display: 'grid', gap: 8 }}>
        <h2 className="ds-h3">Sources</h2>
        {SAMPLE.allegations[0].sources.map((s, i) => (
          <SourceCitation key={i} source={s} lang={lang} />
        ))}
      </section>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button variant="primary">Publish entry</Button>
        <Button variant="secondary">Save draft</Button>
        <Button variant="ghost">View sources</Button>
        <Button variant="danger">Request takedown</Button>
      </div>
    </main>
  );
}
