/** Domain types — aligned with the project's content/data-model.json. */

export type Lang = 'ar' | 'en';
export type Dir = 'rtl' | 'ltr';

/** 0..4 — maps to sources.json evidence_strength_labels. */
export type EvidenceLevel = 0 | 1 | 2 | 3 | 4;

/** Conduct/role, never identity. */
export type EntityType =
  | 'individual'
  | 'organization'
  | 'military_unit'
  | 'security_branch'
  | 'official_body';

/** Legal-process status — never an identity attribute. */
export type EntityStatus =
  | 'alleged'
  | 'investigating'
  | 'indicted'
  | 'sanctioned'
  | 'convicted'
  | 'deceased';

/** Source credibility tier (sources.json). */
export type SourceTier = 'A' | 'B' | 'C';

export interface Source {
  tier: SourceTier;
  title: string;
  publisher: string;
  date: string;
  /** Optional reference label/link text, e.g. "A/HRC/…". */
  ref?: string;
  url?: string;
}

export interface Allegation {
  description: string;
  period: string;
  location: string;
  /** Mapped to a recognized legal framework where applicable. */
  classification?: string;
  sources: Source[];
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  /** Role / position — NOT identity. */
  role: string;
  status: EntityStatus;
  evidence: EvidenceLevel;
  version: number;
  rightOfReply: 'none' | 'filed';
  allegations: Allegation[];
}
