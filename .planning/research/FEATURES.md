# Feature Research

**Domain:** Civic human-rights documentation & accountability platform (named-actor, source-backed public record; transitional-justice aligned)
**Researched:** 2026-05-31
**Confidence:** HIGH (table stakes / anti-features grounded in established HR-documentation practice + project's own encoded principles; differentiators MEDIUM)

## Feature Landscape

Reputable accountability/documentation platforms (UN IIIM, UN CoI on Syria, SNHR, Violations Documentation Center, Syrian Archive, HURIDOCS/Uwazi) converge on a shared shape: **structured intake → multi-level verification → source-tiered evidence with strength labelling → versioned/auditable records → published record that supports lawful mechanisms.** The features below are categorized against that consensus and against this project's encoded `principles.json` / `workflow.json` / `sources.json`.

### Table Stakes (Users Expect These)

Missing any of these makes the platform either not credible (to courts, HR orgs, the public) or not safe.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Bilingual AR/EN public site with key parity** | Subject-matter is Syrian; credibility + reach require both. Project constraint. | MEDIUM | Every entry, label, status, and policy page must exist in both. i18n key parity is a hard requirement, not a nice-to-have. |
| **Structured evidence submission intake (named actor + specific conduct + ≥1 source)** | Every credible platform (SNHR victim form, VDC, Uwazi) intakes via a structured form, not free text. | MEDIUM | Enforce `submission_accept_requirements` from workflow.json: named individual/entity, specific act/role (what/where/roughly when), ≥1 source with working link or uploaded doc, submitter attestation. |
| **Intake boundary/rules engine (auto-reject at submission)** | Without it, the project's non-negotiable boundaries are policy, not structure. | HIGH | Implements `rejection_rules`: GROUP_TARGET, INCITEMENT, NO_SOURCE, WEAK_SOURCE, PRIVATE_TARGETING, INNOCENT_PARTY, MISMATCH, HATE_TONE. Auto-rejects with a standard reason. This is the load-bearing safeguard — see Differentiators (it's also a differentiator vs typical orgs that do this manually). |
| **Source citation per claim (no source, no publication)** | Defining trait of every credible mechanism; "evidence over allegation." | MEDIUM | Each claim links to ≥1 source from `sources.tiers`. Sources visible on the public entry. Store source type, URL/uploaded doc, and which specific claim it supports. |
| **Source-tier classification (A/B/C)** | Mirrors IIIM/CoI/SNHR source hierarchies. | LOW–MEDIUM | A = UN bodies, courts, sanctions lists; B = recognized HR orgs, legal filings; C = investigative journalism, verified public documentation (never sole basis for a strong claim). |
| **Multi-stage verification pipeline** | The universal credibility mechanism; SNHR runs "multi-level verification." | HIGH | Implements `verification_pipeline`: intake_auto_screen → triage → source_verification → dual_review → legal_safety_gate → publish → monitor_and_correct. Each stage gated and logged. |
| **Source verification step** | Source must exist, be authentic, and actually support the specific claim (MISMATCH guard). | MEDIUM | Reviewer confirms each cited source is real, from a credible org, and supports the precise claim — not just topically related. |
| **Dual independent review** | Two-reviewer agreement is the standard guard against single-reviewer bias/error. | MEDIUM | Two independent reviewers must agree before advancing; disagreement escalates. Requires reviewer roles, assignment, and conflict-of-interest separation. |
| **Legal/safety gate before publish** | Defamation + data-protection exposure is the top survival threat (PROJECT constraint). | MEDIUM | Phrasing matched to evidence strength; right-of-reply contact recorded; privacy/safety re-check. First living-person entries require qualified-lawyer review per project constraint. |
| **Evidence-strength labelling on every entry** | Lets readers (and courts) calibrate trust; prevents overclaiming. | LOW–MEDIUM | Use `evidence_strength_labels`: Under review / Single credible source / Multi-source corroborated / UN-IIIM-documented / Court-confirmed. Label must update as evidence changes. |
| **Accurate evidentiary framing language** | "alleged / credibly implicated / under investigation / convicted" used exactly as evidence supports. | LOW | Enforced at the legal/safety gate. Controlled vocabulary, not free-text claims of guilt. |
| **Public record with search/filter — by conduct, role, evidence strength, status ONLY** | Users expect to find entries; courts/journalists need filtering. | MEDIUM | Filter dimensions strictly conduct/role/status/strength. Identity-based filters MUST be structurally impossible (see Anti-Features). |
| **Right-of-reply & correction process** | Code of conduct + basic fairness + defamation defense. | MEDIUM | Named parties can respond; corrections honored promptly. Needs a contact/intake channel, a reviewer workflow, and a visible response/correction surface on the entry. |
| **Immutable, versioned audit trail per entry** | Chain-of-custody equivalent; required for evidentiary credibility and accountability of the platform itself. | MEDIUM–HIGH | Every state change (who, when, why) versioned and tamper-evident. Mirrors chain-of-custody practice for HR evidence. |
| **Legal disclaimer, terms, privacy/data policy** | Legal necessity; data-protection compliance. | LOW | Bilingual. Includes data-deletion / right-of-reply contact path. |
| **Public Code of Conduct + anti-discrimination policy + "what we do / don't" page** | Sets scope, signals seriousness, pre-empts misuse. | LOW | Direct render of `principles.json`. The "what we do / don't" page is doing real work — it tells the public this is not a boycott tool. |
| **Victim-support resources / referrals** | Established HR platforms point victims to lawful help; aligns with mission (victim support). | LOW–MEDIUM | Curated, non-interactive referral list (legal aid, UN reporting channels, mental-health). NOT a case-management system in v1. |
| **Takedown / new-evidence / appeals handling** | `monitor_and_correct` stage; entries must be correctable as evidence evolves. | MEDIUM | Distinct from right-of-reply: handles new evidence, rebuttals, and full takedowns with audit trail. |

### Differentiators (Competitive Advantage)

Where this platform can be notably stronger than the typical HR database. These align with the Core Value: *named actor + credible source, no identity targeting, structurally enforced.*

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Anti-discrimination enforced in the data model (no identity fields exist)** | Most platforms enforce non-discrimination by policy; doing it in the schema makes collective/identity targeting *structurally impossible*. This is the project's signature. | MEDIUM | No religion/sect/ethnicity/family/region/tribe fields anywhere. Tags are conduct/role-based only (e.g. command responsibility, detention facility, UN-documented); identity-based tags cannot even be entered. |
| **Conduct-only taxonomy** | Forces "what they did," never "who they are." Reinforces the legal, non-sectarian framing. | MEDIUM | Controlled tag vocabulary tied to conduct/role/legal status. Feeds search/filter cleanly and prevents identity filtering by construction. |
| **Transparency reporting (public methodology + stats)** | Publishing methodology, source-tier breakdowns, rejection-reason stats, and correction counts builds the trust that competitors gain only through reputation. | MEDIUM | Public methodology page + periodic aggregate report (entries published, by evidence strength, corrections issued, right-of-reply received/honored, submissions auto-rejected by reason). Differentiator because few small platforms publish their own accountability metrics. |
| **Explicit "refers to lawful channels" surfacing per entry** | Channels the record toward courts/IIIM/sanctions instead of public mobilization — the safeguard that distinguishes this from a campaign. | LOW–MEDIUM | Each entry surfaces relevant lawful mechanisms (how to report to IIIM/CoI, universal-jurisdiction context) without calling for public action against the individual. |
| **Per-entry evidence-strength transparency (visible sources + label + provenance)** | Reader can independently verify; matches court-grade expectations. | MEDIUM | Show the actual sources, their tier, and (for Tier-C) provenance/authentication notes inline. |
| **Submitter attestation + protection-aware intake** | Reduces malicious/revenge submissions; signals seriousness. | LOW | Attestation that the source is authentic and not submitted to harass/for revenge (already in workflow.json). Optionally protect submitter identity per SNHR-style protection protocols. |
| **AI-assisted source/metadata triage (review-assist only, never auto-publish)** | HURIDOCS Uwazi added AI metadata extraction; can speed source verification and dual review. | MEDIUM–HIGH | Strictly an assistant to human reviewers (extract names/dates/source type, flag possible MISMATCH). Must never bypass dual review or the legal gate. Defer past MVP. |

### Anti-Features (MUST NEVER BUILD — load-bearing for this project)

These are not "commonly requested but problematic" in the ordinary product sense — they are **forbidden by the project's charter, code of conduct, and data model.** Building any of them would convert a documentation archive into a tool for collective punishment or vigilantism and destroy the project's legitimacy and legal defensibility. They must be impossible by construction, not merely disabled.

| Forbidden Feature | Why It Gets Requested | Why It's Forbidden | What To Do Instead |
|-------------------|------------------------|--------------------|--------------------|
| **Boycott / social-pressure / "name-and-shame for exclusion" mechanics** (calls to isolate, deny services, economic exclusion) | "Accountability should have consequences"; mobilization feels powerful. | This is an archive that *refers to lawful channels*, not a campaign that mobilizes the public. INCITEMENT is an auto-reject code. A mobilization tool cannot be safeguarded against misuse. | Surface lawful channels (courts, IIIM/CoI, sanctions advocacy) per entry. Document; refer; do not mobilize. |
| **Targeting / tagging / filtering by religion, sect, ethnicity, family name, region, tribe, or community** | "We need to categorize"; perpetrator demographics seem analytically useful. | Non-negotiable boundary. The unit of documentation is the named individual/entity — never a demographic category. Implies guilt-by-association/origin and enables collective punishment. | No identity fields in the schema at all. Conduct/role-based taxonomy only. Identity-based tags cannot be entered (auto-reject GROUP_TARGET at intake). |
| **Publishing home addresses, live locations, or any data enabling physical targeting (doxxing)** | "People want to find them"; perceived as accountability. | Enables vigilantism/physical harm. PRIVATE_TARGETING is an auto-reject code; "no vigilantism" is in the code of conduct. | Document conduct and official role/affiliation only. Strip/refuse location and contact data at intake and at the legal/safety gate. |
| **Crowd voting / rating on guilt; public "guilty" polls** | Engagement; "let the community decide." | Guilt is not a popularity contest; corrupts the evidence standard; enables mob targeting. | Evidence-strength labels set by dual review + source tier, never by audience vote. |
| **Unmoderated public comments / open discussion threads** | "Community engagement," "let people add context." | Becomes a harassment, sectarian-incitement, and doxxing vector (HATE_TONE, INCITEMENT, PRIVATE_TARGETING all flow through comments). Impossible to safeguard at scale. | No open comments. Additional info flows only through structured submission → verification. Corrections via right-of-reply and the appeals/new-evidence channel. |
| **Naming children or clearly uninvolved persons (family/associates as targets)** | "Complete the picture." | Privacy of the innocent; INNOCENT_PARTY auto-reject. Guilt-by-association is explicitly an offense. | Document only the named actor tied to specific conduct. Reject submissions that target family/children/associates. |
| **Anonymous-rumor-only / single-social-post entries; unverifiable sources** | "It's clearly true / everyone knows." | Fails the evidence standard (NO_SOURCE / WEAK_SOURCE). Anonymous social-media posts and unverified rumor are explicitly not accepted. | Require ≥1 accepted-tier source; Tier-C never the sole basis for a strong claim; everything must be independently checkable. |
| **Auto-publish on submission (no human review)** | Speed, volume. | Bypasses dual review and the legal/safety gate — the entire credibility and defamation defense. | Mandatory full pipeline: triage → source verification → dual review → legal/safety gate → publish. |
| **Engagement metrics / virality features (likes, shares, trending, "most viewed perpetrators")** | Growth, reach. | Reframes a justice record as an outrage feed; incentivizes sensationalism over evidence; nudges toward mobilization. | Neutral, evidence-first presentation. Optional aggregate transparency stats only — never per-target popularity. |

## Feature Dependencies

```
[Bilingual content infra (i18n + key parity)]
    └──required by──> [Public site] + [Public record] + [All policy pages]

[Data model with NO identity fields + conduct/role taxonomy]   ← FOUNDATION
    └──enables──> [Intake boundary engine (GROUP_TARGET auto-reject)]
    └──enables──> [Search/filter by conduct/role/status/strength only]
    └──conflicts with──> [Identity tagging/filtering]  (forbidden by construction)

[Structured submission intake]
    └──requires──> [Source tiers (A/B/C) defined]
    └──requires──> [Intake boundary/rules engine]
                       └──requires──> [Rejection-rule codes + standard reasons]

[Verification pipeline]
    └──requires──> [Reviewer roles + assignment]
    └──requires──> [Source verification step]
    └──requires──> [Dual independent review]
    └──requires──> [Legal/safety gate]
                       └──requires──> [Evidence-strength labels]
                       └──requires──> [Right-of-reply contact capture]
                       └──gated by──> [Qualified-lawyer review before first living-person entries]

[Published entry]
    └──requires──> [Source citation visible] + [Evidence-strength label] + [Audit trail]
    └──enhanced by──> [Lawful-channels referral surface]

[Audit trail (immutable, versioned)]
    └──underpins──> [Monitor/correct stage] + [Right-of-reply] + [Appeals/takedown] + [Transparency reporting]

[Transparency reporting] ──aggregates from──> [Audit trail] + [Rejection-rule stats] + [Evidence-strength distribution]
```

### Dependency Notes

- **Data model precedes everything:** the no-identity-fields / conduct-taxonomy schema is the structural enforcement of the anti-discrimination boundary. It must land before intake and before search, because both depend on it to make identity targeting impossible rather than merely discouraged.
- **Source tiers precede intake & labelling:** the rules engine (WEAK_SOURCE) and the evidence-strength labels both reference the A/B/C tier definitions.
- **Legal/safety gate depends on evidence-strength labels and right-of-reply capture:** framing language is chosen to match the label, and the right-of-reply contact must be recorded before publish.
- **Lawyer review gates the first publish, not the build:** per the PROJECT constraint, no living individual is named publicly until a qualified lawyer reviews the standard and the first entries. This is a release gate, not a code dependency — but it blocks the *publish* milestone.
- **Audit trail underpins all post-publish features:** corrections, right-of-reply, appeals/takedowns, and transparency reporting all read from / write to the versioned trail.
- **Open comments conflict with the entire safety model:** they cannot coexist with the harassment/incitement/doxxing guards, so they are excluded by construction, not configuration.

## MVP Definition

### Launch With (v1)

The smallest set that is both credible and safe. You cannot ship a "lite" version that drops verification or the boundary engine — those are what make it legitimate.

- [ ] **Bilingual AR/EN public site** (mission, "what we do / don't", Code of Conduct, anti-discrimination policy, FAQ, legal disclaimer/terms/privacy) — credibility + legal floor
- [ ] **Data model with no identity fields + conduct/role taxonomy** — structural enforcement of the core boundary; everything depends on it
- [ ] **Source tiers (A/B/C) + evidence-strength labels** — defined and wired into intake and entries
- [ ] **Structured submission intake** (named actor + specific conduct + ≥1 source + attestation) — the front door
- [ ] **Intake boundary/rules engine** (all 8 rejection codes, standard reasons) — the load-bearing safeguard
- [ ] **Verification pipeline with dual independent review + source verification** — credibility core
- [ ] **Legal/safety gate** (framing-to-evidence, privacy re-check, right-of-reply contact capture) — defamation/safety defense
- [ ] **Public record with search/filter by conduct/role/status/strength + visible per-entry sources + strength label** — the product
- [ ] **Right-of-reply & correction process** — fairness + legal defense
- [ ] **Immutable versioned audit trail per entry** — chain-of-custody equivalent
- [ ] **Victim-support referral page** (static curated list) — mission alignment, low cost
- [ ] **Qualified-lawyer review of standard + first entries** — release gate before any living person is named

### Add After Validation (v1.x)

- [ ] **Transparency reporting** (aggregate stats: entries by strength, corrections, right-of-reply honored, auto-rejections by reason) — add once there's a body of entries to report on
- [ ] **Appeals/takedown workflow formalization** — add when right-of-reply volume justifies a distinct, heavier process
- [ ] **Per-entry lawful-channels referral surface** (IIIM/CoI reporting, universal-jurisdiction context) — add once entry template is stable
- [ ] **Provenance/authentication notes for Tier-C sources** — add as media-based submissions appear

### Future Consideration (v2+)

- [ ] **AI-assisted source/metadata triage (review-assist only)** — defer until reviewer volume is the bottleneck; must never bypass human dual review or the legal gate
- [ ] **Bulk import / interoperability with external HR datasets (e.g. Uwazi/HURIDOCS-style)** — defer until methodology and schema are proven
- [ ] **Reviewer collaboration tooling / case management** — defer; v1 keeps victim support as referral-only, not case management

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Data model (no identity fields + conduct taxonomy) | HIGH | MEDIUM | P1 |
| Intake boundary/rules engine | HIGH | HIGH | P1 |
| Structured submission intake | HIGH | MEDIUM | P1 |
| Source tiers + evidence-strength labels | HIGH | LOW | P1 |
| Verification pipeline (dual review + source verification) | HIGH | HIGH | P1 |
| Legal/safety gate | HIGH | MEDIUM | P1 |
| Public record + conduct/role/status/strength search | HIGH | MEDIUM | P1 |
| Right-of-reply & correction | HIGH | MEDIUM | P1 |
| Immutable audit trail | HIGH | MEDIUM–HIGH | P1 |
| Bilingual AR/EN site + policy pages | HIGH | MEDIUM | P1 |
| Victim-support referral page | MEDIUM | LOW | P1 |
| Transparency reporting | MEDIUM | MEDIUM | P2 |
| Lawful-channels referral per entry | MEDIUM | LOW–MEDIUM | P2 |
| Appeals/takedown formalization | MEDIUM | MEDIUM | P2 |
| AI-assisted triage (review-assist only) | MEDIUM | HIGH | P3 |
| External-dataset interoperability | LOW–MEDIUM | HIGH | P3 |

**Priority key:** P1 = must have for launch · P2 = add after validation · P3 = future consideration

## Competitor / Reference Feature Analysis

| Feature | SNHR / VDC | UN IIIM / CoI | HURIDOCS Uwazi | Our Approach |
|---------|------------|---------------|----------------|--------------|
| Structured public intake | SNHR victim-documentation form; public can submit, dept follows up | Confidential submissions (not public-facing) | Bulk + single-record upload, relationships | Public structured intake + boundary engine + attestation |
| Multi-level verification | Multi-source: testimony + OSINT + geo/temporal video analysis | Court-grade evidentiary standards, chain of custody | Tool supports evidentiary standards; verification is org's responsibility | Pipeline with triage → source verification → dual review → legal gate |
| Source tiering / strength labels | Categorized, multi-source corroboration | Evidence weighted to legal standards | Metadata + relationships; org defines tiers | Explicit A/B/C tiers + 5 strength labels on every entry |
| Identity categorization | Categorizes detainees by gender/location/governorate/responsible party | Actor + conduct focused | Flexible schema (org decides) | **Conduct/role only — identity fields do not exist in the schema** (key divergence from SNHR's demographic categorization) |
| Audit trail / chain of custody | Internal protocols | Formal chain of custody | Versioning available | Immutable versioned trail per entry, public-facing accountability |
| Right of reply | Not prominent publicly | N/A (investigative body) | Not a built-in feature | First-class right-of-reply + correction surface |
| Public mobilization | No — documentation org | No — refers to prosecution | No — neutral tool | **Explicitly none** — refers to lawful channels only |

## Sources

- [SNHR Working Methodology (PDF)](https://snhr.org/public_html/wp-content/pdf/english/SNHR_Methodology_en.pdf) — multi-level verification, public victim-documentation form, multi-source methodology (HIGH)
- [Violations Documentation Center — Our Methodology](https://vdc-sy.net/our-methodology/) — Syrian violations documentation methodology (MEDIUM)
- [Syrian Archive — Medica Methodology](https://medical.syrianarchive.org/methodology/) — open-source verification, provenance (MEDIUM)
- [HURIDOCS — Uwazi](https://huridocs.org/technology/uwazi/) — structured HR database: facts/testimonies/evidence/cases, evidentiary archiving, relationships (HIGH)
- [HURIDOCS — Uwazi AI metadata extractor](https://huridocs.org/2025/09/uwazi-ai-powered-metadata-extractor-a-game-changer-for-human-rights-documentation/) — AI-assisted metadata as review-assist (MEDIUM)
- [Access Accountability — Chain of Custody in HR Documentation](https://accessaccountability.org/index.php/2018/08/15/what-is-chain-of-custody-in-human-rights-documentation/) — audit-trail / chain-of-custody rationale (MEDIUM)
- [The Engine Room — Chain of Custody resources](https://documentation-tools.theengineroom.org/resources-chain-of-custody/) — tamper-evidence practice (MEDIUM)
- [OpenGlobalRights — Collecting, preserving, verifying online evidence](https://www.openglobalrights.org/collecting-preserving-and-verifying-online-evidence-of-human-rights-violations/) — verification of online/OSINT evidence (MEDIUM)
- Project-internal encoded practice: `content/workflow.json`, `content/principles.json`, `content/sources.json`, `.planning/PROJECT.md` (HIGH — these already encode the verification pipeline, source tiers, boundaries, and rejection rules used above)

---
*Feature research for: civic human-rights documentation & accountability platform (Syria)*
*Researched: 2026-05-31*
