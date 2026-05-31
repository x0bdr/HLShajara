# Pitfalls Research

**Domain:** Civic human-rights documentation & accountability platform (named perpetrators, Syria crimes, source-backed public record)
**Researched:** 2026-05-31
**Confidence:** HIGH (legal/evidence/safety grounded in Berkeley Protocol, Article 19 defamation standards, EU Anti-SLAPP Directive 2024/1069, GDPR Art. 10/85, documented real-world failures; MEDIUM on Syria-jurisdiction specifics, which require the lawyer-review gate)

> **The single most dangerous mistake in this domain is publishing a named living person before a qualified lawyer in the operating jurisdiction has reviewed the publication standard and the first entries.** Defamation + data-protection exposure is the top existential threat to the project. Every pitfall below is secondary to that gate. PROJECT.md already names it as the #1 constraint; the roadmap must make it a hard, non-skippable phase boundary, not a checklist item.

---

## Critical Pitfalls

### Pitfall 1: Naming a living person before legal review (the existential pitfall)

**What goes wrong:**
An entry naming a living individual goes public before a qualified lawyer reviews the publication standard and the first batch. A single defamation/libel claim — or a GDPR Article 10 complaint over processing criminal-accusation data — can force takedown, drain a volunteer project's funds, chill all future publication, or end the project. Naming the *wrong* person (misidentification) is catastrophic and effectively irreversible reputationally even after correction.

**Why it happens:**
Builder enthusiasm: the intake pipeline and reviewer console "work," so the team flips to public before the legal gate is wired as a hard blocker. Teams treat the lawyer review as advice rather than a gate. The technical capability to publish exists long before the legal authorization does.

**How to avoid:**
- Make "no public naming of a living person without recorded lawyer sign-off" a **system-enforced state**, not a policy line. The publish action must check for a recorded legal-review artifact on that entry (or on the publication standard the entry falls under) and refuse otherwise.
- Distinguish, in the data model, **deceased** vs **living** subjects and **convicted** (court judgment / sanctions listing) vs **alleged**. Convicted/sanctioned/court-cited subjects carry far lower defamation risk (truth + privilege defenses) and can ship earlier; pure-allegation entries on living persons are the highest-risk class and gated hardest.
- Lean on the **truth defense** and **public-interest defense** structurally: require the entry's phrasing to be downgradeable to "alleged / credibly implicated / under investigation" unless a court judgment or sanctions listing supports a stronger claim (workflow.json `legal_safety_gate` already specifies this — enforce it in code).
- Record the lawyer-review artifact (who, when, which standard, which entries) in the immutable audit trail.

**Warning signs:**
- A "publish" button that works without checking a legal-review flag.
- Living-person entries in the pipeline before any lawyer is engaged.
- Phrasing asserting guilt ("committed", "is guilty of") on allegation-tier evidence.
- No deceased/living or alleged/convicted distinction in the schema.

**Phase to address:**
**Foundational / dedicated legal-gate phase before any public naming.** This is a phase boundary, not a task. Schema must carry living/deceased + evidence-tier + legal-review fields from the first data-model phase; the publish-gate enforcement lands before the public record goes live.

---

### Pitfall 2: Misidentification — naming the wrong person (the Tripathi failure)

**What goes wrong:**
The platform publishes a named individual who turns out to be the wrong person, or whose link to the conduct is mistaken. The Boston Marathon bombing crowdsourcing (Reddit r/findbostonbombers) wrongly identified Sunil Tripathi — a missing student who was later found dead — and others (the "Bag Men" NY Post cover). Well-intentioned documentation can destroy an innocent person and expose the project to the most damaging defamation claims.

**Why it happens:**
Name collisions (extremely common with transliterated Arabic names — multiple romanizations, same name across many people), reliance on a single source that itself misidentified, eagerness to publish a "hit," and the crowd-dynamics where a plausible-sounding match snowballs into consensus without verification.

**How to avoid:**
- **Dual independent review** (workflow.json `dual_review`) must specifically confirm *identity resolution*, not just conduct — reviewers verify the named person is the same person the source refers to.
- Treat transliteration/name-matching as a known hazard: require identifying specificity (role, unit, facility, dates) beyond a bare name; record canonical name + variants.
- Require the source to *itself* identify the individual — do not let reviewers infer identity by resemblance or association (the exact error in the Tripathi case).
- Enforce `INNOCENT_PARTY` and guilt-by-association rejection (principles.json) at intake and at review.
- Prominent, fast **right-of-reply and correction** path (PROJECT.md requirement) so a misidentified person can be removed quickly with audit-trailed correction.

**Warning signs:**
- Entries where identity rests on resemblance, shared name, or family association rather than a source naming the specific person.
- No name-variant / transliteration handling.
- Single-source identity on a living-person allegation.
- Review checklist that confirms "the crime happened" but not "this is the right person."

**Phase to address:**
Reviewer console / dual-review phase (identity-resolution check as an explicit review step) and the right-of-reply/correction phase.

---

### Pitfall 3: Mislabeling alleged vs convicted (evidentiary-strength drift)

**What goes wrong:**
An entry states or implies guilt when the evidence only supports "alleged" or "under investigation." This is the difference between a defensible public-interest report and actionable defamation. It also corrodes the project's credibility with the very mechanisms (UN CoI, IIIM, courts) it wants to feed.

**Why it happens:**
Editorial tone creep — strong, emotionally resonant language feels more "true" to documenters of atrocities. Evidence-strength labels exist as display metadata but aren't *bound* to the allowed phrasing of the claim. Sources get upgraded in the writer's mind ("a credible journalist said it" → treated as proven).

**How to avoid:**
- Bind phrasing to evidence tier in the schema: the evidence-strength label gates which verbs/claims are permitted (alleged / credibly implicated / under investigation / convicted), per code_of_conduct "Accurate framing."
- `legal_safety_gate` reviewer step explicitly checks claim phrasing against tier before publish.
- `WEAK_SOURCE` rejection (workflow.json): Tier-C/rumor alone cannot support a serious claim without corroboration.
- Display the evidence-strength label and the sources on every public entry (PROJECT.md requirement) so readers self-calibrate.

**Warning signs:**
- "Committed / perpetrated / is guilty" language on non-convicted subjects.
- Evidence-strength label present but decorative (not enforced against phrasing).
- Serious claims standing on a single Tier-C source.

**Phase to address:**
Data-model phase (tier↔phrasing binding) + legal/safety gate phase.

---

### Pitfall 4: Misuse to target people by identity / mission drift toward mobilization

**What goes wrong:**
Despite the stated scope, the platform is used (or evolves) into an identity-targeting or social-pressure tool — entries that smuggle in sect/ethnicity/family framing, or features that effectively mobilize harassment. This is the precise failure the project was reframed away from, and it would convert an accountability archive into an instrument of collective punishment.

**Why it happens:**
Submitters bring identity-based grievances; "useful" features (share-to-pressure, lists by region, group tags) creep in because they feel impactful; a tag taxonomy quietly admits identity categories. Mission drift under emotional/political pressure.

**How to avoid:**
- Enforce anti-discrimination **structurally**, not by policy (PROJECT.md key decision): **no identity fields exist in the schema** — sect, ethnicity, family, region, tribe, community are not enterable, so identity-based tagging is impossible by construction.
- Conduct/role-based taxonomy only (principles.json `taxonomy_rule`).
- Intake rules-engine auto-rejects `GROUP_TARGET`, `INCITEMENT`, `HATE_TONE` with standard explanations (workflow.json) — at intake, before human review.
- **No boycott/mobilization/share-to-pressure features** (PROJECT.md out-of-scope) — and treat any such feature request as a scope alarm.
- Public-facing search/filter is by conduct, role, evidence strength, status — **never identity** (PROJECT.md).

**Warning signs:**
- Any proposed schema field or tag that encodes demographic identity.
- Feature requests framed as "let people pressure / boycott / share to shame."
- Filter-by-region or filter-by-community appearing in search UI.
- Submissions clustering around a community rather than named actors.

**Phase to address:**
Data-model phase (no identity fields — structural) + intake boundary-engine phase (auto-reject) + every UI/search phase (conduct-only filters).

---

### Pitfall 5: Doxxing / retaliation against subjects, submitters, and reviewers (Syria-specific transnational repression)

**What goes wrong:**
The platform leaks data enabling physical targeting — of named subjects (vigilante retaliation), or far more dangerously, of **submitters, witnesses, and reviewers** who are exposed to regime-affiliated transnational repression. Syrian HRDs and witnesses face documented surveillance, harassment, threats against in-Syria relatives, and intimidation of witnesses in European war-crimes trials. A submitter's identity leak can get someone killed.

**Why it happens:**
Focus on the public record obscures the operational-security surface: submission metadata (IP, EXIF/GPS in uploaded media, account email), reviewer identities, and the temptation to publish locating detail about subjects "for completeness." Even after the Assad regime's fall, regime-affiliated networks and successor actors retain reach.

**How to avoid:**
- Never publish home addresses, live locations, or anything enabling physical targeting (`PRIVATE_TARGETING` rejection + code_of_conduct "No vigilantism") — enforced at intake and review.
- **Strip EXIF/GPS and provenance metadata from uploaded media before storage/display**; treat uploaded files as carriers of locating data about the *submitter*, not just the subject.
- Submitter anonymity by design: minimal collection, no public attribution of submitters, ability to submit without an identifying account; protect submission IP/metadata.
- Reviewer identities are internal-only and pseudonymous in the public audit trail (record "reviewer A/B" not real names publicly).
- Threat-model explicitly for **transnational repression / state-level adversary** — this is not a generic web app threat model.

**Warning signs:**
- Uploaded media served with original EXIF intact.
- Submission flow that requires/exposes real identity.
- Any subject field for address/coordinates.
- Reviewer real names in any public-facing data.

**Phase to address:**
Submission-intake phase (metadata stripping, minimal collection) + data-model phase (no locating fields) + a dedicated **security/threat-model phase** treating a state-level adversary.

---

### Pitfall 6: Audit-trail tampering / non-immutability (accountability of the accountability tool)

**What goes wrong:**
The review/audit trail can be silently altered or an entry's history rewritten, so the platform cannot prove *how* a claim was verified, by whom, against which sources, and what changed. A tamperable record destroys the platform's credibility with courts/IIIM/CoI (which it exists to feed) and gives any defamation defendant an opening to allege manipulation.

**Why it happens:**
"Immutable audit trail" (PROJECT.md requirement) is implemented as ordinary mutable DB rows with an `updated_at` column. Edits overwrite rather than version. No integrity protection (hashing/append-only) so changes leave no trace.

**How to avoid:**
- Append-only, versioned trail: every state change (intake → triage → verification → dual-review → legal gate → publish → correction) is an immutable record, never an overwrite.
- Cryptographic integrity (hash-chaining of entries / signed records) so tampering is detectable, aligning with Berkeley Protocol chain-of-custody expectations for material that may feed legal mechanisms.
- Corrections and takedowns are *new versioned events*, preserving the prior state — supports right-of-reply auditability.
- Store source snapshots (see Pitfall 7) within the trail.

**Warning signs:**
- Audit "trail" is a single mutable row with `updated_at`.
- Edits replace prior values with no version retained.
- No integrity hash; admins can edit history without trace.

**Phase to address:**
Data-model / persistence phase (append-only versioned schema) — must be designed in from the start; retrofitting immutability is expensive and incomplete.

---

### Pitfall 7: Source link-rot and broken chain-of-custody (evidence evaporates)

**What goes wrong:**
A published entry cites a URL that later 404s, gets edited, or disappears (common with news, social media, deleted official pages). The claim is now unsupported — "no source, no publication" is violated retroactively — and the project can't reconstruct what the source said at verification time. For atrocity documentation this also breaks the evidentiary value Berkeley-Protocol-style work depends on.

**Why it happens:**
Sources are stored as bare links, not captured artifacts. No snapshotting at verification time. Reliance on live external URLs for the integrity of the record.

**How to avoid:**
- **Capture and store the source at verification time** (archived snapshot / uploaded document / hash of the captured content), not just the URL — Berkeley Protocol identify→collect→**preserve**→verify.
- Record source metadata: tier (per sources.tiers), capture date, hash, who verified.
- Periodic link-health monitoring; flag entries whose live sources have rotted (display still backed by snapshot).
- `source_verification` stage (workflow.json) must confirm the source *exists, is authentic, and actually supports the specific claim* — and preserve it.

**Warning signs:**
- Sources stored as URLs only, no captured copy.
- No capture date / hash on sources.
- Entries silently relying on live external links staying up.

**Phase to address:**
Source-verification phase (capture + hash + tier) + monitoring phase (link-health).

---

### Pitfall 8: Fabricated submissions and brigading / coordinated manipulation

**What goes wrong:**
Bad actors flood the intake with fabricated entries, doctored "sources," or coordinated campaigns to (a) falsely implicate an innocent target, (b) bury the platform's reviewers, or (c) discredit the platform by getting a provably-false entry published. Politically charged Syria context makes this a near-certainty, including state-backed disinformation.

**Why it happens:**
Open intake + emotional/political stakes + adversaries with resources. Treating volume as success. No rate-limiting, no submitter accountability, source verification that checks "link works" but not "link is authentic and genuinely supports this."

**How to avoid:**
- `source_verification` checks **authenticity and that the source actually supports the claim** (workflow.json) — not mere existence; `MISMATCH` rejection for sources that don't support the claim.
- Dual independent review + escalation on disagreement (workflow.json) blocks single-actor manipulation.
- Submitter attestation (authentic, not for harassment/revenge) creates accountability and a basis for rejecting bad-faith submissions.
- Rate-limiting / abuse detection on intake; flag coordinated bursts.
- Tier-aware corroboration: serious claims need corroboration beyond a single weak source (`WEAK_SOURCE`).

**Warning signs:**
- Spikes of similar submissions targeting one person.
- "Sources" that are screenshots/unverifiable rather than checkable artifacts.
- Reviewers rubber-stamping under volume pressure.

**Phase to address:**
Intake phase (rate-limit, attestation) + source-verification phase (authenticity, MISMATCH) + dual-review phase.

---

### Pitfall 9: Media-provenance spoofing / AI-generated "evidence"

**What goes wrong:**
A submitter provides an AI-generated or doctored image/video as "evidence," or spoofs provenance metadata to make fabricated media look authentic. Deepfake incidents rose ~900% from 2023→2025; a single published synthetic "atrocity photo" that's debunked discredits the whole archive.

**Why it happens:**
Reviewers trust media or trust metadata. C2PA/Content Credentials, where present, are treated as proof — but C2PA only proves provenance *when a valid credential exists* and relies on trust in whoever signed it; absence of a credential proves nothing, and metadata can be stripped or spoofed.

**How to avoid:**
- Treat media as **corroborating**, never sole basis for a serious claim about a named person; the textual source chain (courts, UN, sanctions, recognized HR orgs) carries the weight.
- Where C2PA/Content Credentials are present, verify them — but never treat their absence as disproof or their presence as full proof (per C2PA's own documented limitations).
- Verification step for AI-generation indicators on submitted media; record media hash; preserve original.
- Prefer Tier-A/B textual sourcing for identity + conduct; media supports, doesn't establish.

**Warning signs:**
- Entries resting primarily on a photo/video of a named person.
- Reviewers accepting media without provenance checks.
- Provenance metadata trusted at face value.

**Phase to address:**
Source-verification phase (media provenance + AI-generation checks, hashing).

---

### Pitfall 10: Weak access control on reviewer/admin surface

**What goes wrong:**
The reviewer console / admin backend is compromised (weak auth, over-broad roles, no MFA), letting an attacker publish false entries, alter the audit trail, or — worst — exfiltrate submitter/witness identities. For a state-level-adversary threat model, this is a top-tier target.

**Why it happens:**
Internal tooling is under-hardened ("it's just for our reviewers"). No role separation between triage / reviewer / legal-gate / admin. Shared accounts. No MFA. Submitter PII accessible to every role.

**How to avoid:**
- Strong auth + mandatory MFA on all privileged accounts; no shared accounts.
- Role separation matching the pipeline: triage, reviewer A, reviewer B, legal-gate, admin — least privilege; dual-review enforced by *distinct* authenticated identities.
- Submitter PII compartmentalized — most roles never need real submitter identity.
- All privileged actions written to the immutable audit trail (ties to Pitfall 6).
- Threat-model assumes a resourced adversary (transnational repression context).

**Warning signs:**
- Reviewer console without MFA.
- One "admin" role with all powers.
- Both "independent" reviews doable by one account.
- Submitter identity visible to all internal users.

**Phase to address:**
Reviewer-console / auth phase + dedicated security/threat-model phase.

---

### Pitfall 11: Jurisdiction & hosting chosen without legal strategy (libel tourism / hostile-forum exposure)

**What goes wrong:**
The platform is incorporated/hosted in a jurisdiction with weak speech protections or strong claimant-friendly defamation rules, exposing it to libel tourism (claimants forum-shop to weak-protection jurisdictions; defamation is excluded from Rome II, so forum choice is wide open in the EU). A subject sues in the most hostile available forum; the project lacks anti-SLAPP cover.

**Why it happens:**
Hosting/incorporation decided on cost/convenience before legal counsel. No awareness that defamation forum rules and anti-SLAPP coverage vary enormously, and that the EU Anti-SLAPP Directive (2024/1069) covers only civil cross-border matters — **not criminal defamation and not purely domestic proceedings**, and member-state transposition is lagging (deadline May 2026, few compliant).

**How to avoid:**
- Make hosting/incorporation jurisdiction part of the **lawyer-review gate** (Pitfall 1) — choose a forum with strong public-interest/journalistic defamation defenses and meaningful anti-SLAPP protection.
- Understand the GDPR posture: Article 10 restricts processing criminal-accusation data, but Article 85 journalistic/public-interest exemption can apply — scope varies sharply by member state (broad in Nordics, narrow in Austria/Italy/Bulgaria). Counsel must confirm the exemption holds in the chosen jurisdiction.
- Budget/plan for SLAPP defense (early-dismissal, cost-recovery mechanisms) where available.

**Warning signs:**
- Hosting/incorporation chosen before counsel engaged.
- No analysis of defamation forum rules or anti-SLAPP coverage for the chosen jurisdiction.
- Assuming GDPR journalistic exemption applies without jurisdiction-specific confirmation.

**Phase to address:**
Legal-gate phase (jurisdiction/hosting decision tied to lawyer review) — before public launch.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Audit trail as mutable rows with `updated_at` | Faster CRUD | Tamperable record; useless to courts; defamation-defense liability | **Never** — append-only from day one |
| Identity fields in schema "for filtering, hidden in UI" | Easier ad-hoc queries | Structural anti-discrimination guarantee broken; mission-drift vector | **Never** — no identity fields, period |
| Store sources as bare URLs | Simple intake | Link-rot evaporates evidence; broken chain-of-custody | Never for published entries; OK only pre-verification draft |
| Serve uploaded media with original EXIF | Less processing | Leaks submitter/subject location → physical harm | **Never** — strip on ingest |
| Soft-launch public naming before lawyer sign-off | Demo momentum | Existential legal exposure; possible project death | **Never** |
| Single "admin" role | Fast to build | One compromise = full takeover + PII leak | Only in pre-public internal dev with no real data |
| Reviewer real names in public audit trail | Transparency | Exposes reviewers to transnational repression | **Never** — pseudonymize publicly |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| C2PA / Content Credentials | Treating presence as proof / absence as disproof | Verify when present; never sole basis; media corroborates only |
| Web archive / snapshot service | Relying on live source URLs | Capture + hash source at verification; store snapshot |
| Media upload pipeline | Passing files through with metadata | Strip EXIF/GPS on ingest; hash original; AI-gen screening |
| Auth provider | No MFA on reviewer/admin | Mandatory MFA; role separation; distinct identities for dual review |
| Sanctions/court datasets (sources.tiers) | Treating as live truth without snapshot | Cite + snapshot + tier-label at verification time |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reviewer bottleneck under brigading | Queue floods, reviewers rubber-stamp | Rate-limit intake; abuse detection; auto-reject at boundary engine | First coordinated campaign (likely early, given Syria politics) |
| Synchronous source-fetch on publish | Slow/failed publishes when sources slow | Async capture + cached snapshot | When source hosts are slow/blocked |
| Full-text search over growing record | Slow public search | Index conduct/role/status/tier fields (never identity) | Thousands of entries |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing submitter IP / account / metadata | Witness identified → retaliation, possibly lethal | Minimal collection, anonymized submission, protect metadata |
| EXIF/GPS in served media | Location of submitter or subject leaked | Strip on ingest |
| Generic web threat model | State-level adversary underestimated | Threat-model for transnational repression explicitly |
| Tamperable audit trail | False entries / history rewrite undetected | Append-only + hash-chain |
| Over-broad reviewer roles | Manipulated publication; PII exfiltration | Least-privilege role separation + MFA |
| Publishing locating detail on subjects | Vigilante targeting (against project ethics + law) | `PRIVATE_TARGETING` reject; no address/coords fields |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Search/filter by region/community | Enables identity-targeting use | Conduct/role/status/evidence-tier filters only |
| Evidence-strength label as decoration | Readers over-read allegations as proven | Bind label to phrasing; show sources on every entry |
| Buried/slow right-of-reply | Misidentified person can't get relief; legal risk grows | Prominent, fast correction + reply path |
| Sharing UI that reads as "expose/shame" | Drifts toward mobilization | Frame as documentation referring to lawful channels; no pressure CTAs |
| AR/EN parity gaps in legal/CoC text | Legal disclaimers/CoC inconsistent across languages → exposure | Full AR+EN key parity, legally reviewed in both |

## "Looks Done But Isn't" Checklist

- [ ] **Publish action:** Often missing the hard legal-review gate — verify it refuses to publish a living-person entry without a recorded lawyer sign-off.
- [ ] **Audit trail:** Often just `updated_at` — verify append-only versioning + integrity hashing; corrections create new versions.
- [ ] **Anti-discrimination:** Often policy-only — verify there are literally no identity fields in the schema and identity tags cannot be entered.
- [ ] **Media handling:** Often serves originals — verify EXIF/GPS stripped on ingest and original hashed.
- [ ] **Sources:** Often bare URLs — verify snapshot + hash + tier captured at verification time.
- [ ] **Submitter safety:** Often collects more than needed — verify minimal collection, anonymity, protected metadata.
- [ ] **Evidence labels:** Often decorative — verify tier gates allowed phrasing (alleged vs convicted).
- [ ] **Dual review:** Often bypassable by one account — verify two distinct authenticated identities required.
- [ ] **Right-of-reply:** Often a static page — verify it produces an audit-trailed correction/removal workflow.
- [ ] **Jurisdiction/hosting:** Often a cost decision — verify counsel reviewed defamation forum + anti-SLAPP + GDPR posture.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Misidentified person published | HIGH | Immediate takedown via right-of-reply; audit-trailed correction; public correction; counsel notified; post-mortem on identity-resolution |
| Defamation/GDPR claim received | HIGH | Counsel; assess truth/public-interest/Art.85 defenses; preserve audit trail + source snapshots as defense evidence |
| Submitter/witness identity leaked | CRITICAL | Incident response; notify affected person; rotate credentials; assume physical risk; legal + safety support |
| Audit trail found tampered | HIGH | Restore from integrity-protected backups; forensic review; re-verify affected entries; harden access |
| Brigading flood | MEDIUM | Rate-limit; quarantine burst submissions; tighten boundary engine; manual triage of flagged cluster |
| Source link-rot at scale | LOW (if snapshots exist) / HIGH (if not) | Serve snapshots; backfill captures; if no snapshots, re-verify or unpublish unsupported entries |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Naming before legal review | Legal-gate phase (hard blocker) before any public naming | Publish refuses living-person entry without recorded lawyer sign-off |
| 2. Misidentification | Dual-review + right-of-reply phases | Review step confirms identity resolution; correction path works end-to-end |
| 3. Alleged vs convicted mislabel | Data-model + legal/safety-gate phases | Tier gates phrasing; gate rejects mismatched verbs |
| 4. Identity-targeting / mobilization drift | Data-model (no identity fields) + intake-boundary + search phases | No identity field exists; GROUP_TARGET auto-rejects; filters conduct-only |
| 5. Doxxing / retaliation | Intake + data-model + security/threat-model phases | EXIF stripped; no locating fields; submitter anonymized |
| 6. Audit-trail tampering | Persistence/data-model phase | Append-only + hash; edits create versions, no overwrite |
| 7. Source link-rot / chain-of-custody | Source-verification + monitoring phases | Snapshot + hash + tier stored; link-health flags rot |
| 8. Fabricated / brigaded submissions | Intake + source-verification + dual-review phases | Rate-limit; MISMATCH/WEAK_SOURCE reject; escalation on disagreement |
| 9. Media-provenance spoofing | Source-verification phase | Media corroborates only; provenance/AI checks; hashed |
| 10. Weak access control | Reviewer-console/auth + security phases | MFA; least-privilege roles; dual review by distinct identities |
| 11. Jurisdiction/hosting/anti-SLAPP | Legal-gate phase (pre-launch) | Counsel-reviewed forum + anti-SLAPP + GDPR Art.85 posture recorded |

## Sources

- Berkeley Protocol on Digital Open Source Investigations (OHCHR / UC Berkeley HRC) — identify/collect/preserve/verify standards, chain-of-custody — https://www.ohchr.org/en/publications/policy-and-methodological-publications/berkeley-protocol-digital-open-source ; https://www.law.berkeley.edu/article/human-rights-center-berkeley-protocol-social-media-evidence-war-crimes-nuremberg/ (HIGH)
- Article 19, "International and Comparative Defamation Standards" — truth & public-interest defenses, chilling effect — https://www.article19.org/data/files/pdfs/analysis/defamation-standards.pdf (HIGH)
- Perpetrator identification methodology (Rohingya documentation, PMC) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8892691/ (MEDIUM)
- GDPR Art. 10 (criminal convictions/offences) and Art. 85 (journalistic exemption) — https://gdpr-info.eu/art-10-gdpr/ ; https://policyreview.info/articles/news/journalism-vs-data-privacy-gdpr-dilemma/1787 ; https://www.tandfonline.com/doi/full/10.1080/17577632.2022.2129614 (SLAPPed by the GDPR) (HIGH on text, MEDIUM on cross-jurisdiction application)
- EU Anti-SLAPP Directive 2024/1069 — scope (civil cross-border only), early dismissal, libel-tourism / Rome II exclusion, transposition lag — https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401069 ; https://www.consilium.europa.eu/en/press/press-releases/2024/03/19/anti-slapp-final-green-light-for-eu-law-protecting-journalists-and-human-rights-defenders/ ; https://rsf.org/en/two-years-after-eu-anti-slapp-directive-member-states-still-slow-protect-journalists (HIGH)
- C2PA / Content Credentials — provenance, limitations (trust in signer, strippable metadata), deepfake surge — https://spec.c2pa.org/specifications/specifications/2.4/explainer/Explainer.html ; https://truescreen.io/articles/c2pa-standard-history-limitations/ ; https://worldprivacyforum.org/posts/privacy-identity-and-trust-in-c2pa/ (HIGH on standard, MEDIUM on adoption figures)
- Syrian HRD transnational repression, witness intimidation, doxxing — U.S. State Dept Country Reports (Syria 2024); EFF OHCHR submission; Front Line Defenders; Access Now (Syria cybercrime law) — https://www.state.gov/reports/2024-country-reports-on-human-rights-practices/syria ; https://www.eff.org/deeplinks/2026/04/effs-submission-un-ohchr-protection-human-rights-defenders-digital-age ; https://www.frontlinedefenders.org/en/location/syria (HIGH)
- Crowdsourced misidentification harm — Boston Marathon / Sunil Tripathi; "Digilantism" (Oxford BJC) — https://en.wikipedia.org/wiki/Suicide_of_Sunil_Tripathi ; https://academic.oup.com/bjc/article/57/2/341/2623876 (HIGH)
- Project context: .planning/PROJECT.md, content/principles.json, content/workflow.json (HIGH — authoritative project boundaries)

---
*Pitfalls research for: Syria civic human-rights documentation & accountability platform*
*Researched: 2026-05-31*
