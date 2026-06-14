# UI-SPEC — "Submit a Report" Multi-Step Wizard (لستَ شجرة)

**Status:** Draft for build · **Date:** 2026-06-14 · **Owner:** frontend-dept
**Replaces:** the single-page `SubmitClient.tsx` form and the rejected 8-sector boycott taxonomy.
**Design contract for:** a one-step-per-page, card-driven, bilingual (EN/AR + RTL) accountability intake whose every entry is a **named actor + documented conduct + ≥2 credible public sources**.

---

## 0. Purpose & scope

A guided wizard that walks a submitter from "who" → "what they did" → "the evidence" → review → submit. It collects **only** what an accountability record needs and is structurally incapable of collecting targeting/identity data. Nothing it captures is published on submit; everything enters the existing `submissions` → dual-review → lawyer-gate pipeline.

**In scope:** the public submission UI, its interaction model, fields, validation, bilingual/RTL/a11y behavior, and the CSS/component additions.
**Out of scope:** reviewer console, the publish pipeline, backend schema changes (flagged in §8 where the UI wants a field the API lacks).

---

## 1. Safety constraints — design-level guardrails (non-negotiable)

These are **product requirements**, enforced in the UI in addition to the server screens. They are why this form exists.

| # | Rule | UI consequence |
|---|------|----------------|
| S1 | **No private-targeting fields.** | There is **no** field for phone, car plate, home/street address, map pin, "nearest location," or personal social handle (LinkedIn/Instagram/etc.). Not collected, not stored, not "for internal search." |
| S2 | **No identity/sect fields.** | No sect, religion, ethnicity, family, tribe, region, or "community" field or card. The `entityType` cards are role-of-actor, never identity. |
| S3 | **No loyalty/opinion field.** | No "supports the regime?", "attitude," "sympathizer," or `شبيح`/epithet card. Targeting rides on documented *conduct*, never belief or affiliation. |
| S4 | **No profession/sector target categories.** | No "cleaners / drivers / pharmacies / taxis / shops" target lists. The enabler network is captured by **conduct** (financing, propaganda, informing, operating a detention site), as named actors. |
| S5 | **Coarse location only.** | Location is **governorate/city level**, describing the *site of the documented conduct* — never a residence. The address/GPS regexes (§9) block street-level input inline. |
| S6 | **Source-first, anecdote-demoted.** | Publication evidence = **≥2 credible public sources** (required). A submitter's account is an optional, non-public **lead note** that can never substitute for a source. |
| S7 | **Anonymity by default.** | `isAnonymous` defaults **on**. Submitter contact is optional and clearly labeled "reviewer follow-up only, never published." |
| S8 | **Nothing publishes on submit.** | Copy throughout states that entries enter review and that a living person is never named publicly without lawyer sign-off. |

If any future request reintroduces an S1–S4 field, it is rejected at design review, not negotiated.

---

## 2. Interaction model

### 2.1 One step per page
The wizard renders **exactly one step at a time**, centered in `.page-container-narrow` (max-width 720px). The single-scroll form is replaced.

### 2.2 Two step archetypes
| Archetype | Advance trigger | Examples |
|---|---|---|
| **Choice step** | Tapping a **card** auto-advances (single-select). No "Next" button. | Actor class, Entity subtype, Conduct type, Role-in-act |
| **Input step** | Explicit **Next** button (`.btn primary`), gated on validation. | Identity, Description, Evidence, Media, Submitter |

### 2.3 Card auto-advance behavior
1. On `pointerup`/`Enter`/`Space`, the chosen card gets `.choice-card.selected` (brand border + brass check, see §5).
2. After **`var(--dur)` (200ms)** — a confirm beat so the selection is *seen* — the wizard transitions to the next step.
3. `prefers-reduced-motion: reduce` → advance is **immediate** (no delay, no slide).
4. Returning via **Back** re-renders the choice step with the prior card already `.selected` and focused.
5. Selecting a *different* branch (e.g. switching Individual↔Entity) **invalidates downstream answers** that depended on it and reroutes (see §2.6).

### 2.4 Back & progress
- A persistent **Back** control (`.btn ghost`, leading chevron) on every step except the first. It is the **inline-start** affordance (auto-mirrors in RTL).
- A **progress indicator** at the top: a row of step pills (`.wizard-progress` → `.chip`/`.chip.on`) showing *completed · current · upcoming*, plus a text "Step N of M / الخطوة N من M". Pills for completed steps are tappable (jump back); upcoming pills are inert.
- Browser **Back/Forward** must work: each step pushes a history entry (see §2.5).

### 2.5 State, routing, persistence
- **Single source of truth:** one `wizard` state object (extends the current `form` shape, §8) held in a `useReducer`/context at the wizard root.
- **Routing:** step is reflected in the URL as a query param `?step=<id>` (e.g. `/en/submit?step=conduct`) via `next-intl` navigation `router.push` with `scroll:false`. This gives free browser-history Back/Forward and deep-link/refresh survival.
- **Draft persistence:** on every change, serialize `wizard` to `sessionStorage` under `hls.submit.draft.v1`. On mount, offer to restore (`.legal` notice: "Resume your draft? / استئناف المسودة؟"). Clear on successful submit and on explicit "Start over."
- **Refresh guard:** `beforeunload` warns if the draft is dirty and unsubmitted.

### 2.6 Branching & guards
- `Actor class = Individual` → skip the Entity-subtype step; `entityType = "individual"`.
- `Actor class = Entity` → show Entity-subtype step; `entityType` = chosen subtype.
- A step is **reachable only if** all prior required steps validate; deep-linking to a later `?step=` with incomplete state redirects to the first incomplete step.
- Changing an upstream choice that orphans a downstream answer clears the downstream value and shows a one-line `.legal` notice on return.

### 2.7 Transitions
- Step change: cross-fade + 12px inline-directional slide, `transform`/`opacity`, `var(--dur) var(--ease)`. Direction follows travel (forward = toward inline-end, back = toward inline-start) so it mirrors in RTL automatically.
- All transitions disabled under `prefers-reduced-motion: reduce`.

---

## 3. Step-by-step page flow

Total **M = 9** numbered steps (intro and confirmation are unnumbered). Progress counts only steps 1–9; the Entity-subtype step is "1b" and does not increment the visible count for the Individual branch.

### Step 0 — Intro (unnumbered)
- **Type:** static page. Heading (`.ds-h1`), 3 bullet "rules" (named actor · ≥2 public sources · no private/identity data — `.ds-body`), `.legal` note that nothing is published without review + lawyer sign-off.
- **Action:** `.btn primary` "Begin / ابدأ". Sets expectations and cuts garbage intake.
- **i18n:** `submit.introTitle`, `submit.introRule1..3`, `submit.introGate`, `submit.begin`.

### Step 1 — Who is this about? *(choice)*
- **Cards (single-select, auto-advance):**
  - **An individual** — *a named person documented in a public source.* → `entityType="individual"`, go to Step 2.
  - **An entity** — *an organization, unit, body, company, or outlet.* → go to Step 1b.
- **i18n:** `submit.q_actorClass`, `submit.actorIndividual`, `submit.actorIndividualHint`, `submit.actorEntity`, `submit.actorEntityHint`.

### Step 1b — What kind of entity? *(choice, Entity branch only)*
- **Cards → `entityType` enum (exact literals):**
  | Card | value |
  |---|---|
  | Organization | `organization` |
  | Military unit | `military_unit` |
  | Security branch | `security_branch` |
  | Official body | `official_body` |
- Auto-advance to Step 2. **i18n:** reuse existing `submit.typeOrganization`, `submit.typeMilitaryUnit`, `submit.typeSecurityBranch`, `submit.typeOfficialBody` + new `submit.q_entitySubtype`.

> Enabler network (the lawful "support environment") is **not** a separate card here — a front company / financier / propaganda outlet is entered as `organization` (or `individual`) and distinguished by its **conduct** in Step 3.

### Step 2 — Identity *(input)*
| Field | Maps to | Required | Constraints / UI |
|---|---|---|---|
| Name | `entityName` | ✓ | `min1 max255`. Helper: "As named in your source." |
| Documented role / title | `entityRole` | ✓ | `min1 max500`. Helper: e.g. "Brigadier, Branch 215" / "front company". **MISMATCH pre-check** (§9) vs the chosen `entityType`. |
| Country | (→ `allegationLocation` prefix) | ✓ | select. |
| Governorate / city | (→ `allegationLocation`) | optional | select/text, **coarse only**; address regex blocks street-level (§9). |
| Public identifier (entities only) | (→ appended to `entityRole` or a source) | optional | official website/registry URL. **No** personal socials. |
- **Next** gated on name + role + country. **i18n:** `submit.idName`, `submit.idRole`, `submit.idRoleHint`, `submit.idCountry`, `submit.idArea`, `submit.idAreaHint`, `submit.idPublicRef`.

### Step 3 — What did they do? *(choice)*
- **Conduct cards (single-select, auto-advance).** Writes a controlled value to `allegationClassification` (§8 notes promotion to a real enum + `triageCategory`).
  - Perpetrator acts: **Arbitrary detention · Torture · Enforced disappearance · Extrajudicial killing · Sexual violence**
  - Support-network acts: **Material support (financing) · Arms / logistics supply · Money laundering · Propaganda / whitewashing · Providing information to security (informing) · Property / asset seizure · Operating a detention or torture site · Command responsibility**
  - **Other (describe)** — routes to Step 5 with a required free-text conduct summary.
- Each card has a one-line definition (`.ds-caption`). **i18n:** `submit.q_conduct`, `submit.conduct_detention`, `submit.conduct_torture`, `submit.conduct_disappearance`, `submit.conduct_killing`, `submit.conduct_sexualViolence`, `submit.conduct_financing`, `submit.conduct_arms`, `submit.conduct_laundering`, `submit.conduct_propaganda`, `submit.conduct_informing`, `submit.conduct_seizure`, `submit.conduct_detentionSite`, `submit.conduct_command`, `submit.conduct_other` (+ `_def` suffix for each definition).

### Step 4 — Their role in that act *(choice)*
- **Cards (single-select, auto-advance):** Direct perpetrator · Ordered / commanded it · Financed it · Supplied it · Informed / provided information · Owned / controlled the implicated entity · Other.
- Composed into `entityRole`/`allegationDescription` context (§8). **i18n:** `submit.q_roleInAct`, `submit.role_perpetrator`, `submit.role_commander`, `submit.role_financier`, `submit.role_supplier`, `submit.role_informant`, `submit.role_owner`, `submit.role_other`.

### Step 5 — Describe the documented act *(input)*
| Field | Maps to | Required | Constraints |
|---|---|---|---|
| Description | `allegationDescription` | ✓ | **`min20 max10000`** (enforce client-side). Live counter. Inline screens for GROUP_TARGET / PRIVATE_TARGETING / INCITEMENT / HATE_TONE / INNOCENT_PARTY (§9) as **warnings**, in server order. |
| Time period | `allegationPeriod` | optional | `max100`, coarse ("2012–2014"). |
- **Next** gated on ≥20 chars and no hard-block screen hit. **i18n:** `submit.descLabel`, `submit.descHint`, `submit.descCounter`, `submit.period`.

### Step 6 — Evidence *(input — the keystone)*
- **Sources (required, ≥2):** repeatable rows → `sourceLinks[]`. Each row:
  - **Source URL** (`url`, required, `type=url`)
  - **Source type** (optional select: UN/IIIM · Court record · Sanctions list · Recognized HR org · Corroborated journalism · Official filing) — UI hint, encoded into `title` until a real field exists (§8).
  - **Title** (`title`, optional, `max500`).
  - `+ Add source` (`.btn secondary`), remove (`.btn ghost danger`).
- **Live source counter** with the rule surfaced **up front**: "Minimum 2 independent public sources / مصدران مستقلان موثوقان على الأقل." Reuses `sourceFiles[]` count toward the 2.
- **Lead note (optional, non-public):** the **"notes" field that replaces "your experience."** Textarea, labeled *"For reviewers only. A note points us to verify — it is never published and never counts as a source. / للمراجعين فقط…"* Maps to a new `leadNote` field (§8).
- **Next** gated on **`sourceLinks.length + sourceFiles.length ≥ 2`**. **i18n:** `submit.sourcesTitle`, `submit.sourcesRule`, `submit.sourceUrl`, `submit.sourceType`, `submit.sourceType_un/_court/_sanctions/_hr/_journalism/_official`, `submit.sourceTitleField`, `submit.addSource`, `submit.leadNote`, `submit.leadNoteHint`.

### Step 7 — Supporting media *(input, optional)*
- **Uploads → `sourceFiles[]`** via existing `/api/upload` (returns `{hash,filename,originalName,url,size}`). Drag-drop + picker; per-file removable cards (mirror current upload UI).
- **Safety copy (`.legal`):** "Media supports a sourced claim — it is not proof on its own. Image **and video** metadata is stripped; uploads are private and reviewed; do not upload faces of victims, children, or bystanders. / لا تُنشر تلقائيًا…"
- **Optional link** field (validated, archived server-side; a personal social link is rejected with a `.legal-error`).
- **Next / Skip.** **i18n:** `submit.mediaTitle`, `submit.mediaSafety`, `submit.mediaLink`, `submit.skip`.

> **Backend dependency (flag):** the current `/api/upload` strips EXIF for images via `sharp` only. **Video metadata stripping (e.g. `ffmpeg -map_metadata -1`) must be added** before this step accepts video. Until then, the spec restricts uploads to images + documents and hides video from the picker. (Owner: backend-dept.)

### Step 8 — About you *(input)*
- **Anonymous toggle** `isAnonymous`, **default ON** (`.ds-input` checkbox). When ON, name/email inputs are **disabled and cleared**; server drops them regardless.
- When OFF: optional `submitterName` (`max255`), `submitterEmail` (email). Helper: "Used only for reviewer follow-up. Never published. / لن يُنشر."
- **Next.** **i18n:** `submit.anonTitle`, `submit.anonToggle`, `submit.anonHelp`, reuse `submit.fullName`, `submit.email`.

### Step 9 — Review before submit *(summary)*
- Read-only summary grouped by step (Actor, Conduct, Description, Evidence, Media, You). Each group has an **Edit** link (`.btn ghost`) that routes to `?step=<id>` and returns to review.
- **Source list** shown explicitly with the count badge; if < 2, the Submit button is disabled with an inline `.legal-error`.
- **Affirmation checkbox (required to enable Submit):** "I affirm this concerns documented conduct by a named actor, supported by the public sources cited. / أُقرّ بأن هذا يتعلق بسلوك موثّق…"
- **Submit** (`.btn primary`) → POST `/api/submit`. Shows `.skeleton`/spinner; disable on in-flight.
- **i18n:** `submit.reviewTitle`, `submit.reviewEdit`, `submit.affirm`, `submit.submitButton` (existing), `submit.reviewSourcesShort`.

### Confirmation / Error (unnumbered)
- **Success:** `.legal-success` panel — "Received. It now enters review; nothing is public yet." + a reference id (`result` from API), and a "Submit another" reset. Clears the draft. Fires existing GTM `SUBMIT_CLICK`.
- **Failure:** map the API `result.code` (rejection enum) to plain bilingual copy and route the user back to the offending step:
  | code | message key | returns to |
  |---|---|---|
  | `NO_SOURCE` / `WEAK_SOURCE` | `submit.err_sources` | Step 6 |
  | `PRIVATE_TARGETING` | `submit.err_private` | Step 5 |
  | `GROUP_TARGET` | `submit.err_group` | Step 5 |
  | `INNOCENT_PARTY` | `submit.err_innocent` | Step 5 |
  | `INCITEMENT` / `HATE_TONE` | `submit.err_tone` | Step 5 |
  | `MISMATCH` | `submit.err_mismatch` | Step 2 |
- **i18n:** `submit.successTitle`, `submit.successBody`, `submit.submitAnother`, `submit.err_*`.

---

## 4. Information architecture map

```
Intro
 └─ 1 Actor class ─(Individual)────────────────┐
        └─(Entity)→ 1b Entity subtype ──────────┤
 2 Identity (name, role, coarse location) ◄─────┘
 3 Conduct type (cards)
 4 Role in act (cards)
 5 Describe act (+ period)
 6 Evidence (≥2 sources + optional lead note)
 7 Media (optional, metadata-stripped)
 8 About you (anon default)
 9 Review → Submit → Confirmation
```

---

## 5. Card component spec (`.choice-card`)

New classes in `hlshajara.css`, built from tokens, modeled on `.card.interactive` + `.chip`.

```
.choice-grid        → display:grid; gap:var(--space-3); grid-template-columns:1fr;
                      @media(min-width:560px){ grid-template-columns:1fr 1fr; }
.choice-card        → background:var(--surface); border:1px solid var(--border);
                      border-radius:var(--radius-lg); box-shadow:var(--shadow);
                      padding:18px 20px; cursor:pointer; text-align:start;
                      transition: box-shadow var(--dur) var(--ease),
                                  transform var(--dur) var(--ease),
                                  border-color var(--dur) var(--ease);
.choice-card:hover  → box-shadow:var(--shadow-md); transform:translateY(-2px);
.choice-card:focus-visible → outline:2px solid var(--focus-ring); outline-offset:2px;
.choice-card.selected → border-color:var(--brand); box-shadow:var(--inset-hair),var(--shadow-md);
.choice-card .title   → .ds-h3 / font-display; color:var(--fg1);
.choice-card .desc    → .ds-caption; color:var(--fg2); margin-block-start:4px;
.choice-card .check   → inline-end aligned; color:var(--brass-500); opacity:0 → 1 when .selected;
```
- **Semantics:** the card group is `role="radiogroup"` with `aria-labelledby` = step heading; each card `role="radio"` `aria-checked`. Roving tabindex; **Arrow keys** move selection, **Enter/Space** confirms (triggers auto-advance).
- **No icons required**, but if used they are decorative (`aria-hidden`). Do **not** use brass for decoration elsewhere (brass = evidence-strength only); the card check mark is the sanctioned brass use.
- **Touch target** ≥ 44px height; full card is the hit area.

---

## 6. Review screen spec (`.review-*`)

```
.review-group   → .card; .card-pad; margin-block-end:var(--space-4);
.review-group .head → .flex-between; title (.ds-eyebrow, locale-aware) + Edit (.btn ghost btn-sm)
.review-row     → .flex-between-start; gap:var(--space-4); padding-block:6px; border-block-end:1px solid var(--border)
.review-row .k  → .ds-meta; color:var(--fg3); min-inline-size:120px
.review-row .v  → .ds-body; color:var(--fg1); white-space:pre-wrap; word-break:break-word
.review-sources → list of .mark (mono) + url chips; count via .filter-badge
.review-affirm  → .legal; checkbox + label; Submit disabled until checked AND sources≥2
```
- Empty optional fields render as `—` in `--fg3`, never hidden (so the submitter sees exactly what will be sent).
- Machine values (URLs, ids) use `.ds-mono` and `[dir=rtl] … {direction:ltr;text-align:right}` per the established pattern.

---

## 7. Progress & navigation spec (`.wizard-*`)

```
.wizard            → .page-container-narrow; padding-block:var(--space-8)
.wizard-progress   → display:flex; gap:var(--space-2); flex-wrap:wrap; margin-block-end:var(--space-6)
.wizard-step-pill  → .chip; (.on when current; .done when completed → green-500 border + check; inert when upcoming)
.wizard-count      → .ds-meta; color:var(--fg3)            (“Step 3 of 9 / الخطوة ٣ من ٩”, Arabic-Indic digits via Intl.NumberFormat(locale))
.wizard-panel      → .card; .card-pad-md; min-block-size:… ; the step body
.wizard-nav        → .flex-between; margin-block-start:var(--space-6)
.wizard-nav .back  → .btn ghost; leading chevron (logical, mirrors)
.wizard-nav .next  → .btn primary; disabled:[aria-disabled] until step valid
```
- **RTL:** progress runs start→end (auto-mirrors). Step labels/eyebrows must **not** use `text-transform:uppercase`/`letter-spacing` in Arabic — pair every Latin eyebrow with `[dir=rtl]{letter-spacing:0;text-transform:none}` per the codebase rule. Chevrons use logical direction or are swapped under `[dir=rtl]`.
- **Focus management:** on step change, move focus to the step `<h2>` (`tabindex=-1`) and announce via a visually-hidden `aria-live="polite"` region: "Step N of M, <title>".

---

## 8. Data mapping to the API + gaps

The wizard targets the **existing** `/api/submit` contract; most steps map directly. Items marked ⚠ want a small backend addition (route to backend-dept/data-dept) — until shipped, the UI uses the interim mapping.

| Wizard data | API field | Status |
|---|---|---|
| Actor class + Entity subtype | `entityType` (5 enums) | ✅ direct |
| Name | `entityName` | ✅ |
| Documented role/title (+ public ref) | `entityRole` | ✅ |
| Country + governorate/city | `allegationLocation` (coarse) | ✅ (constrain client-side) |
| Description | `allegationDescription` (`min20`) | ✅ |
| Time period | `allegationPeriod` | ✅ |
| **Conduct type** | `allegationClassification` (free-text `max100`) interim | ⚠ promote to a real `conductType` enum + populate `triageCategory` |
| **Role in act** | encoded into `allegationDescription` context interim | ⚠ add `roleInConduct` field |
| Source URL/title (×≥2) | `sourceLinks[]` `{url,title?}` | ✅ |
| Source type | encoded into `title` interim | ⚠ add `sourceType` per link |
| Uploaded media | `sourceFiles[]` `{hash,filename,originalName,url,size}` | ✅ (⚠ video metadata-strip needed) |
| **Lead note** | — | ⚠ add non-public `leadNote` field (do **not** fold into the public `allegationDescription`) |
| Anonymous | `isAnonymous` (default→ change to **true**) | ✅ (⚠ flip default) |
| Name/email | `submitterName`,`submitterEmail` | ✅ |

**Client must enforce the stricter-of-two:** `allegationDescription ≥ 20` and **sources ≥ 2** (the `validateSubmission` `WEAK_SOURCE` choke point), so the form never "passes then server-rejects."

---

## 9. Client-side validation (mirror the server screens)

Replicate the pure-regex screens from `persist.ts` as **inline, advisory** checks (the server remains authoritative). Run in the **server's order** so the surfaced error matches what `/api/submit` would return:

1. `NO_SOURCE` → 2. `WEAK_SOURCE` (<2) → 3. `GROUP_TARGET` → 4. `INCITEMENT` → 5. `HATE_TONE` → 6. `INNOCENT_PARTY` → 7. `PRIVATE_TARGETING` → 8. `MISMATCH`.

- **Hard-block (cannot advance):** missing required field, `<2` sources, `description <20`. 
- **Warn-but-explain (block advance on Step 5, with guidance):** GROUP_TARGET, PRIVATE_TARGETING, INNOCENT_PARTY, INCITEMENT, HATE_TONE — show a `.legal-error` naming *why* and how to rephrase toward conduct. These are screened on `entityName + entityRole + allegationDescription` (the same concatenation the server uses).
- **MISMATCH:** cross-check chosen `entityType` card vs `entityRole` text (org descriptors on `individual`, or lone personal ranks on an org type) → `.filter-notice` warning at Step 2.
- Regex sources (keep in a shared `src/lib/screens.ts` so client + server can't drift): phone `\b\d{4,}\s*[-–]\s*\d{4,}\s*[-–]\s*\d{2,}`, GPS `\b\d{1,3}\.\d{1,6},\s*\d{1,3}\.\d{1,6}\b`, address `\b(شارع|ساحة|حي|منطقة|بناية|طابق|شقة|زقاق|عمارة)\s+\w+`, socials `\b(facebook|instagram|twitter|x|tiktok)\.com\/[^\s]+`, plus the GROUP/INNOCENT/INCITEMENT/HATE clusters from the data-contract brief.
- **Coarse-location enforcement (S5):** the address regex runs live on the governorate/city field; a street-level match blocks with "Use city/governorate only."

---

## 10. Bilingual (EN/AR) + RTL spec

- **Every** new string lands as a flat `camelCase` key under the existing **`submit`** namespace in **both** `messages/en.json` and `messages/ar.json` — full parity is mandatory (`check:i18n` gate). Read via `useTranslations("submit")`.
- Direction is inherited from `<html dir>` (set in `layout.tsx`); the wizard manages **no** `dir` itself. Use **logical properties only** (`padding-inline-*`, `margin-inline-*`, `border-inline-*`, `start/end`) — never `left/right`.
- Arabic typography: no `uppercase`/`letter-spacing` on Arabic labels (pair Latin eyebrows with `[dir=rtl]` reset); use Arabic-Indic digits in the step counter via `Intl.NumberFormat(locale)`.
- Machine strings (URLs, ids, hashes) forced LTR inside RTL via `[dir=rtl] .ds-mono{direction:ltr;text-align:right}`.

### New i18n keys (representative — full set per §3; EN ‖ AR)
| key | EN | AR |
|---|---|---|
| `introTitle` | Submit a documented report | تقديم بلاغ موثّق |
| `introRule1` | A named individual or entity | فرد أو جهة محدّدة بالاسم |
| `introRule2` | Backed by ≥2 credible public sources | مدعوم بمصدرين عامّين موثوقين على الأقل |
| `introRule3` | No private, identity, or location data | بلا بيانات خاصة أو هوية أو موقع |
| `q_actorClass` | Who is this report about? | عمّن يدور هذا البلاغ؟ |
| `actorIndividual` | An individual | فرد |
| `actorEntity` | An entity | جهة |
| `q_conduct` | What did they do? | ما الذي ارتكبوه؟ |
| `conduct_informing` | Providing information to security | تزويد الأجهزة الأمنية بمعلومات |
| `sourcesRule` | At least 2 independent public sources | مصدران مستقلان موثوقان على الأقل |
| `leadNote` | Note for reviewers (optional, never published) | ملاحظة للمراجعين (اختياري، لا تُنشر) |
| `anonToggle` | Submit anonymously | تقديم مجهول |
| `affirm` | I affirm this is documented conduct by a named actor | أُقرّ بأن هذا سلوك موثّق لفاعل محدّد |
| `err_private` | Remove private/contact/location details | احذف التفاصيل الخاصة أو الموقع |
> Full key list (≈70 keys) to be added in one PR; `i18n-checker` agent verifies parity before merge.

---

## 11. Accessibility

- **Keyboard:** full operability. Choice cards = radio group with roving tabindex + Arrow/Enter/Space. Inputs standard tab order. Back/Next reachable and operable.
- **Focus:** on step change, focus the step heading (`tabindex=-1`); never trap. `:focus-visible` = 2px `var(--focus-ring)` brass, offset 2px (existing global).
- **Screen reader:** `aria-live="polite"` step announcement; progress conveyed via `aria-current="step"` on the active pill and text count (not color alone). Card selection state via `aria-checked`.
- **Reduced motion:** disable slide/auto-advance delay; advance immediately.
- **Contrast:** all text/token pairs meet WCAG AA on `--surface`/`--bg`; error reliance is never color-only (icon + text in `.legal-error`).
- **Targets:** ≥44px; inputs use existing `.ds-input` focus ring.

---

## 12. Visual / CSS additions (new `WIZARD` section in `hlshajara.css`)

- Add a clearly-commented `/* ===== WIZARD / STEPPER ===== */` block. Classes: `.wizard`, `.wizard-progress`, `.wizard-step-pill(.on/.done)`, `.wizard-count`, `.wizard-panel`, `.wizard-nav(.back/.next)`, `.choice-grid`, `.choice-card(.selected)`, `.choice-card .title/.desc/.check`, `.review-group/.review-row/.review-sources/.review-affirm`.
- **Only** reference existing tokens (`--brand`, `--surface`, `--border`, `--radius-lg`, `--shadow*`, `--dur`, `--ease`, `--focus-ring`, `--space-*`, `--green-500/600`, `.ds-*` roles). No new colors. No Tailwind utilities.
- Reuse wholesale: `.btn`/`.btn primary|secondary|ghost`, `.card`, `.ds-input`, `.ds-select`, `.form-field`, `.form-row`, `.chip`, `.filter-badge`, `.legal`/`.legal-error`/`.legal-success`, `.skeleton`, `.page-container-narrow`.

---

## 13. Acceptance criteria (build checklist)

- [ ] One step renders at a time in `.page-container-narrow`; choice steps auto-advance on card select after `var(--dur)` (instant under reduced-motion); input steps gate on a Next button.
- [ ] Back is present on every step but the first; browser Back/Forward and refresh restore the correct step and data (`?step=` + `sessionStorage` draft).
- [ ] Progress pills show done/current/upcoming, are RTL-correct, and read with `aria-current`.
- [ ] Individual branch skips Entity-subtype; entityType resolves to one of the 5 enums exactly.
- [ ] No field for phone, plate, address/street, map pin, social handle, sect/identity, loyalty/opinion, or profession-target exists anywhere (S1–S4). Location is coarse and street-level input is blocked inline (S5).
- [ ] Evidence step blocks advance below **2** sources and surfaces the rule up front; lead note is clearly non-public and never counts as a source (S6).
- [ ] `isAnonymous` defaults **on**; enabling it disables+clears name/email (S7).
- [ ] Review screen shows everything to be sent (optional = "—"), edit-routes to each step, and requires the affirmation checkbox + ≥2 sources before Submit (S8).
- [ ] Client screens mirror the server regexes in server order; rejection codes map to bilingual messages and route back to the offending step.
- [ ] All new strings exist in EN **and** AR under `submit`; `check:i18n` passes; RTL verified (logical props, no Arabic uppercase/letter-spacing, LTR machine strings).
- [ ] Full keyboard + screen-reader operable; focus moves to step heading on change; AA contrast.
- [ ] ⚠ backend follow-ups filed: `conductType` enum + `triageCategory`, `roleInConduct`, per-source `sourceType`, non-public `leadNote`, `isAnonymous` default flip, **video metadata stripping** before video uploads are enabled.

---

*This spec describes the lawful, source-gated, named-actor intake. It deliberately cannot collect the private-targeting, identity, loyalty, or profession-target data that the earlier 8-sector draft proposed — those are out of scope by design (S1–S4), not pending implementation.*
