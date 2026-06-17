# Proposal: Required vs Optional Fields per Report Category

> This file proposes which wizard fields should be **required** and which should remain **optional** for every report category.  
> It is based on the live wizard config (`src/lib/wizard/category-config.ts`, `src/lib/wizard/step-logic.ts`, `src/lib/validation.ts`) and the presentational step components.
>
> **Status:** Draft — awaiting operator approval before implementation.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ **Required** | User cannot proceed without filling it. |
| ⚪ **Optional** | Field is shown but can be left empty. |
| 🔗 **At least one** | User must fill at least one field in the listed group. |
| 📌 **Auto / hidden** | Field is prefilled or not shown to the user. |

---

## Global Rules (apply to every category)

| Step | Field | Proposal | Rationale |
|------|-------|----------|-----------|
| Step 1 | `reportCategory` | ✅ Required | Must choose a category to start. |
| Step 2 | `orgType` (subtype) | ✅ Required | The whole detail schema depends on it. |
| Step 2 | `orgSubTypeOther` | ✅ Required **only if** `orgType == "other"` | Needed to know what "other" means. |
| Step 2 | `entityName` | ✅ Required **unless** `reportCategory == "individuals"` | The public record needs a named entity. |
| Step 3 | `country` | ✅ Required | Coarse location is the minimum viable locator. |
| Step 3 | `governorate` | ✅ Required | City/governorate makes the record useful. |
| Step 3 | `address` | ⚪ Optional | Can be sensitive; should not block submission. |
| Step 3 | Contact group (phone / email / website / maps / social) | 🔗 At least one required | Reviewers need *some* public contact/identifier to verify. |
| Step 4 | Detail-flag group | 🔗 At least one required per category | Ensures the report is about a concrete person/role tied to the entity. |
| Step 5 | `allegationDescription` | ✅ Required (min 20 chars, keep existing rule) | The narrative is the core of the report. |
| Step 5 | `supportingDocuments` | ⚪ Optional | Helpful but not always available. |
| Step 6 | `mediaLink`, `sourceFiles`, `mediaNotes` | ⚪ Optional | Evidence is strongly encouraged but should not block. |
| Step 7 | `isAnonymous` | ✅ Required (toggle, default ON) | User must make an active choice. |
| Step 7 | `submitterName` + `contactMethods` | ⚪ Optional **if** anonymous; 🔗 at least one contact method **if** not anonymous | Needed for follow-up only when identity is revealed. |
| Step 8 | Affirmation checkbox | ✅ Required | Legal gate before submission. |

---

## 1. Commercial (تجاري)

> Subtypes: `brand`, `factory`, `other`

### Step 2 — entity-type-name

| Field | Subtype | Proposal |
|-------|---------|----------|
| Subtype selection | all | ✅ Required |
| `orgSubTypeOther` | `other` | ✅ Required |
| `entityName` | `brand` / `factory` | ✅ Required |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| `contactPhone` / `entityEmail` / `websiteName` / `googleMapsLink` / `socialContactMethods` | 🔗 At least one required |

### Step 4 — report-details

#### Detail flags (multi-select)

| Flag | Proposal |
|------|----------|
| `owner` | At least one of: `owner`, `investor`, `labour`, `support_data` |
| `investor` | (same group) |
| `labour` | (same group) |
| `support_data` | (same group) |

#### Subtype-driven fields

| Field | Subtypes | Proposal |
|-------|----------|----------|
| `ownerNames` | `brand`, `factory` | ⚪ Optional *(note: the UI always shows it, but making it optional avoids blocking when owner is unknown)* |

#### Flag-driven fields (when selected)

| Field | Required when flag selected? | Rationale |
|-------|------------------------------|-----------|
| `ownerNames` (owner flag) | ✅ At least one entry | If user selects owner, they must name at least one. |
| `investorNames` (investor flag) | ✅ At least one entry | Same as above. |
| `labourEntries` (labour flag) | ✅ At least one entry `{name, role}` | Same as above. |
| `supportDataInfo` (support_data flag) | ✅ Required | If selected, must explain who/what. |

### Notes
- Commercial entities are organizations; `entityType` stays `organization`.
- `entityRole` is auto-populated from the Arabic subtype label.

---

## 2. Individuals (أفراد)

> Subtypes: `street_vendor`, `driver`, `cleaner`, `shabbiha`, `volunteer`, `university_student`, `influencer`, `gov_employee`, `private_employee`, `kiosk`, `delivery_app`, `craftsman`, `other`

### Step 2 — entity-type-name

| Field | Proposal |
|-------|----------|
| Subtype selection | ✅ Required |
| `orgSubTypeOther` | ✅ Required only if `other` |
| `entityName` | 📌 Hidden / not shown | Name is captured in Step 4 as `reportedPersonName`. |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Subtype-driven fields

| Field | Proposal |
|-------|----------|
| `reportedPersonName` | ✅ Required |
| `reportedPersonPosition` | ⚪ Optional |
| `reportedPersonPhone` | ⚪ Optional |
| `reportedPersonSocialMedia` | ⚪ Optional |

#### Detail flags

> Category has **no** detail flags in config. Proposal: keep none. The subtype-driven fields above supply the identity.

### Notes
- `entityType` is `individual`.
- `entityRole` is auto-populated from Arabic subtype label (e.g. "بائع متنقل").
- For `driver`, `delivery_app`, etc., the user can add vehicle/app details in `reportedPersonPosition` or media notes if relevant.

---

## 3. Educational (تعليمي)

> Subtypes: `academy`, `institute`, `course`, `schools`, `universities`, `kindergarten`

### Step 2 — entity-type-name

| Field | Proposal |
|-------|----------|
| Subtype selection | ✅ Required |
| `orgSubTypeOther` | ✅ Required only if `other` *(currently no `other` subtype; ignore)* |
| `entityName` | ✅ Required |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Detail flags (at least one required)

| Flag | Proposal |
|------|----------|
| `owner` | At least one of: `owner`, `investor`, `labour`, `academic_staff`, `support_data` |
| `investor` | (same group) |
| `labour` | (same group) |
| `academic_staff` | (same group) |
| `support_data` | (same group) |

#### Subtype-driven fields

| Field | Proposal |
|-------|----------|
| `ownerNames` | ⚪ Optional |

#### Flag-driven fields

| Field | Required when flag selected? |
|-------|------------------------------|
| `ownerNames` (owner) | ✅ At least one entry |
| `investorNames` (investor) | ✅ At least one entry |
| `labourEntries` (labour) | ✅ At least one entry |
| `academicStaff` (academic_staff) | ✅ At least one entry `{name, role}` |
| `supportDataInfo` (support_data) | ✅ Required |

---

## 4. Service (خدمي)

> Subtypes: `cleaning_office`, `delivery_app`, `beauty_center`, `massage`, `barber`, `laundry`, `club`, `renovation`, `import_export`, `exchange`, `tech_company`, `wedding_hall`, `other`

### Step 2 — entity-type-name

| Field | Proposal |
|-------|----------|
| Subtype selection | ✅ Required |
| `orgSubTypeOther` | ✅ Required only if `other` |
| `entityName` | ✅ Required |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Detail flags (at least one required)

| Flag | Proposal |
|------|----------|
| `owner` | At least one of: `owner`, `investor`, `labour`, `support_data` |
| `investor` | (same group) |
| `labour` | (same group) |
| `support_data` | (same group) |

#### Subtype-driven fields

| Field | Proposal |
|-------|----------|
| `ownerNames` | ⚪ Optional |

#### Flag-driven fields

Same as **Commercial**.

---

## 5. Tourism (سياحي)

> Subtypes: `travel_company`, `properties`, `hotel`, `restaurant_cafe`, `taxi`, `car_rental`, `private_car`

### Special rule

- `properties` redirects internally to `real_estate`. Treat as **Real Estate** below.

### Step 2 — entity-type-name

| Field | Subtype | Proposal |
|-------|---------|----------|
| Subtype selection | all | ✅ Required |
| `entityName` | `travel_company`, `hotel`, `restaurant_cafe`, `car_rental` | ✅ Required |
| `entityName` | `taxi`, `private_car` | ⚪ Optional or label changes to office/driver/app name |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Subtype `taxi` / `private_car`

| Field | Proposal |
|-------|----------|
| `carType` | ⚪ Optional |
| `carPlate` | ✅ Required |
| `driverPhone` | ⚪ Optional |
| `driverName` | ⚪ Optional |
| `taxiNumber` | ⚪ Optional |
| `appName` | ⚪ Optional |

> Detail flags are **excluded** for `private_car`; for `taxi` the normal flags apply.

#### Other tourism subtypes (after redirecting `properties` to real_estate)

Detail flags (at least one required): `owner`, `investor`, `labour`, `support_data`.

Subtype-driven field: `ownerNames` — ⚪ Optional.

---

## 6. Medical (طبي)

> Subtypes: `pharmacy`, `personal_clinic`, `private_hospital`, `medical_center`

### Step 2 — entity-type-name

| Field | Proposal |
|-------|----------|
| Subtype selection | ✅ Required |
| `entityName` | ✅ Required |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Detail flags (at least one required)

| Flag | Proposal |
|------|----------|
| `owner` | At least one of: `owner`, `investor`, `labour`, `doctor`, `nurse`, `support_data` |
| `investor` | (same group) |
| `labour` | (same group) |
| `doctor` | (same group) |
| `nurse` | (same group) |
| `support_data` | (same group) |

> `pharmacy` excludes `doctor` and `nurse` flags.

#### Subtype-driven fields

| Field | Proposal |
|-------|----------|
| `ownerNames` | ⚪ Optional |

#### Flag-driven fields

| Field | Required when flag selected? |
|-------|------------------------------|
| `ownerNames` (owner) | ✅ At least one entry |
| `investorNames` (investor) | ✅ At least one entry |
| `labourEntries` (labour) | ✅ At least one entry |
| `doctors` (doctor) | ✅ At least one entry |
| `nurses` (nurse) | ✅ At least one entry |
| `supportDataInfo` (support_data) | ✅ Required |

---

## 7. Organizations (منظمات)

> Subtypes: `civil_society`, `social_media_company`, `media_institution`, `quasi_governmental`, `association`, `student_club`

### Step 2 — entity-type-name

| Field | Proposal |
|-------|----------|
| Subtype selection | ✅ Required |
| `entityName` | ✅ Required |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Detail flags

| Subtype | Available flags | Proposal |
|---------|-----------------|----------|
| `civil_society` / `social_media_company` / `media_institution` | owner, labour, labour_members, investor, support_data | At least one required |
| `quasi_governmental` / `association` / `student_club` | labour, labour_members, investor, support_data | At least one required |

#### Subtype-driven fields

| Subtype | Fields shown | Proposal |
|---------|--------------|----------|
| `civil_society`, `social_media_company`, `media_institution` | `ownerNames` | ⚪ Optional |
| `quasi_governmental`, `association`, `student_club` | none | — |

#### Flag-driven fields

| Field | Required when flag selected? |
|-------|------------------------------|
| `ownerNames` (owner) | ✅ At least one entry |
| `investorNames` (investor) | ✅ At least one entry |
| `labourEntries` (labour) | ✅ At least one entry |
| `labourMembers` (labour_members) | ✅ At least one entry |
| `supportDataInfo` (support_data) | ✅ Required |

---

## 8. Real Estate (عقاري)

> Subtypes: `house`, `apartment`, `villa`, `chalet`, `farm`, `land`, `shop`, `office`

### Step 2 — entity-type-name

| Field | Proposal |
|-------|----------|
| Subtype selection | ✅ Required |
| `entityName` | ✅ Required |

### Step 3 — location-info

| Field | Proposal |
|-------|----------|
| `country` | ✅ Required |
| `governorate` | ✅ Required |
| `address` | ⚪ Optional |
| Contact group | 🔗 At least one required |

### Step 4 — report-details

#### Detail flags (at least one required)

| Flag | Proposal |
|------|----------|
| `owner` | At least one of: `owner`, `investor`, `support_data` |
| `investor` | (same group) |
| `support_data` | (same group) |

#### Subtype-driven fields

| Field | Proposal |
|-------|----------|
| `ownerNames` | ⚪ Optional |
| `propertyType` | ⚪ Optional |

#### Flag-driven fields

Same ownership/support rules as Commercial.

---

## Summary Table: Required-Gates by Step

| Step | Current gate | Proposed gate |
|------|--------------|---------------|
| 1 report-category | category chosen | ✅ keep |
| 2 entity-type-name | subtype + name (if org) | ✅ keep, also require `orgSubTypeOther` when subtype is `other` |
| 3 location-info | country chosen | ✅ require country + governorate + at least one contact/identifier |
| 4 report-details | always passes | ✅ require at least one detail flag + fill the flag-specific field |
| 5 experience | description ≥ 20 chars | ✅ keep |
| 6 media-evidence | always passes | ⚪ keep optional |
| 7 about-you | always passes | ✅ require active anonymity choice; require contact if not anonymous |
| 8 review | affirmation | ✅ keep |

---

## Open Questions for Operator

1. **Should `address` ever be required?** Currently proposed optional everywhere to protect submitters.
2. **For `taxi` / `private_car`, should `carPlate` be required?** Proposed yes — it is the strongest public identifier.
3. **For `individuals`, should `reportedPersonPosition` be required?** Proposed no; name is enough.
4. **Should `supportingDocuments` (Step 5) be required?** Proposed no; narrative is the core gate.
5. **Should we enforce at least one source file or media link in Step 6?** Proposed no, but worth considering.
6. **For anonymous submitters, should we still require *some* non-identifying contact method for follow-up?** Proposed no; anonymous means anonymous.

---

## Next Step

After operator approval of this proposal, the implementation plan is:
1. Update `src/lib/validation.ts` (`reportMetadataSchema`) with conditional required rules.
2. Update `src/lib/wizard/step-logic.ts` `requires*` predicates to match.
3. Add client-side `required` attributes / validation messages in the step components.
4. Add/adjust i18n keys for new validation messages (AR + EN parity).
5. Run `node scripts/i18n-parity-check.js` and `npm run build`.
6. Deploy to `test-sanad`.
