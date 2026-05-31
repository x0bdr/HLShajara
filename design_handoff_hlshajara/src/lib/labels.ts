import type { EvidenceLevel, EntityStatus, EntityType, Lang } from './types';

/** Bilingual label dictionaries. Index/keys match the domain types. */

export const EVIDENCE_LABELS: Record<Lang, Record<EvidenceLevel, string>> = {
  en: {
    0: 'Under review',
    1: 'Single credible source',
    2: 'Multi-source corroborated',
    3: 'UN / IIIM-documented',
    4: 'Court-confirmed',
  },
  ar: {
    0: 'قيد المراجعة',
    1: 'مصدر موثوق واحد',
    2: 'مؤكَّد بمصادر متعددة',
    3: 'موثّق أمميًّا',
    4: 'مؤكَّد قضائيًّا',
  },
};

export const STATUS_LABELS: Record<Lang, Record<EntityStatus, string>> = {
  en: {
    alleged: 'Alleged',
    investigating: 'Under investigation',
    indicted: 'Indicted',
    sanctioned: 'Sanctioned',
    convicted: 'Convicted',
    deceased: 'Deceased',
  },
  ar: {
    alleged: 'مُدَّعى',
    investigating: 'قيد التحقيق',
    indicted: 'مُتَّهم',
    sanctioned: 'خاضع لعقوبات',
    convicted: 'مُدان',
    deceased: 'متوفّى',
  },
};

/** CSS custom-property name carrying each status dot color (defined in tokens.css). */
export const STATUS_VAR: Record<EntityStatus, string> = {
  alleged: '--st-alleged',
  investigating: '--st-investigating',
  indicted: '--st-indicted',
  sanctioned: '--st-sanctioned',
  convicted: '--st-convicted',
  deceased: '--st-deceased',
};

export const TYPE_LABELS: Record<Lang, Record<EntityType, string>> = {
  en: {
    individual: 'individual',
    organization: 'organization',
    military_unit: 'military unit',
    security_branch: 'security branch',
    official_body: 'official body',
  },
  ar: {
    individual: 'فرد',
    organization: 'منظمة',
    military_unit: 'وحدة عسكرية',
    security_branch: 'فرع أمني',
    official_body: 'جهة رسمية',
  },
};

export const dirFor = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');
