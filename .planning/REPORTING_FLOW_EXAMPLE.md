# Reporting Wizard — Full Thread / Data Map

> Generated from the live wizard config (`src/lib/wizard/registry.ts`, `src/lib/wizard/category-config.ts`) plus the presentational step components.
> This document shows **every possible field a user may see or fill** while submitting a report, followed by a concrete walk-through for the **first category: Commercial (تجاري)**.

---

## 1. Wizard Steps (linear flow)

```
1. report-category      ← اختر التصنيف
2. entity-type-name     ← النوع والاسم
3. location-info        ← معلومات الجهة
4. report-details       ← تفاصيل الجهة
5. experience           ← تجربتك
6. media-evidence       ← صور وفيديو وملاحظات
7. about-you            ← عنك
8. review               ← مراجعة قبل الإرسال
```

---

## 2. Data Fields Shown Per Step

### Step 1 — report-category
- Single-choice card grid.
- All 8 categories:
  - `commercial`      تجاري
  - `individuals`     أفراد
  - `educational`     تعليمي
  - `service`         خدمي
  - `tourism`         سياحي
  - `medical`         طبي
  - `organizations`   منظمات
  - `real_estate`     عقاري

---

### Step 2 — entity-type-name
- **Subtype card select** (depends on category).
- If subtype is `other`:
  - `orgSubTypeOther` — حدد النوع (غير ذلك)
- **Name field** (hidden for `individuals` category):
  - `entityName` — اسم المنشأة / العلامة التجارية / العقار / إلخ.

---

### Step 3 — location-info
- `country` — الدولة (dropdown, default سوريا)
- `governorate` — المحافظة (dropdown if سوريا, else free text)
- `address` — العنوان (المنطقة، الحي، الشارع، القرية أو أقرب معلم)
- `contactPhoneCountryCode` + `contactPhone` — رقم تواصل الجهة
- `entityEmail` — البريد الإلكتروني للجهة
- `websiteName` — رابط الموقع الإلكتروني للجهة
- `googleMapsLink` — رابط Google Maps (اختياري)
- `socialContactMethods` — حسابات التواصل الاجتماعي (اختياري)
  - Types: x, facebook, instagram, telegram, whatsapp, tiktok, website

---

### Step 4 — report-details
#### A. Detail flags (multi-select cards, depends on category/subtype)
Possible flags:
- `owner`             المالك / الشريك / الشركاء
- `investor`          المستثمر / المستثمرون
- `labour`            عمال / موظفون
- `labour_members`    عمال / موظفون / أعضاء
- `support_data`      غير ذلك
- `academic_staff`    مدرب / أستاذ / دكتور / معيد
- `member`            عضو / أعضاء
- `doctor`            طبيب / دكتور
- `nurse`             ممرض / ممرضة
- `club_name`         اسم النادي / الجمعية
- `student`           طالب (mapped to reportedPersonName)
- `instructor`        مدرّب (mapped to reportedPersonName)
- `professor`         أستاذ (mapped to professorName)
- `university_doctor` دكتور جامعي (mapped to universityDoctorName)

#### B. Adaptive free-text / array fields
- Subtype-driven fields (always shown for the subtype):
  - `reportedPersonName`
  - `reportedPersonPhone`
  - `reportedPersonPosition`
  - `reportedPersonSocialMedia`
  - `reportedPersonNickname`
  - `carType`, `carPlate`
  - `driverPhone`, `driverName`
  - `taxiNumber`, `appName`
  - `propertyType`
  - `ownerNames` (array)
- Flag-driven fields (shown only when the matching flag is selected):
  - `ownerNames` (array)
  - `investorNames` (array)
  - `labourEntries` (array of {name, role})
  - `labourMembers` (array of {name, role})
  - `academicStaff` (array of {name, role})
  - `doctors` (array)
  - `nurses` (array)
  - `members` (array)
  - `supportDataInfo` (text, max 256)
  - `clubName`
  - `professorName`
  - `universityDoctorName`

---

### Step 5 — experience
- `allegationDescription` — صف تجربتك / ما حصل (min 20 chars)
- `supportingDocuments` — المستندات الداعمة المتوفرة
  - photos, videos, audio, documents, screenshots, other

---

### Step 6 — media-evidence
- `mediaLink` — رابط فيديوهات أو مستندات عامة
- `sourceFiles` — رفع ملفات (image, pdf, doc, txt, video)
  - Each file: `label` (اسم الوسيط)
- `mediaNotes` — ملاحظات إضافية

---

### Step 7 — about-you
- `isAnonymous` — التقديم بشكل مجهول (toggle, default ON)
- If NOT anonymous:
  - `submitterName` — الاسم الكامل
  - `contactMethods` — وسائل التواصل (اختياري)
    - x, facebook, instagram, telegram, whatsapp, tiktok, phone, email, website

---

### Step 8 — review
Read-only summary of everything above, grouped by:
- التصنيف
- الموقع
- الجهة / الشخص
- التفاصيل
- التجربة
- الوسائط الداعمة
- بياناتك
- Affirmation checkbox

---

## 3. Concrete Example — First Category: Commercial (تجاري)

```
1. report-category
   └─ commercial  ← "تجاري" (متاجر، مصانع، علامات تجارية، محلات ومولات)

2. entity-type-name
   ├─ subtype
   │  ├─ brand   ← "براند / اسم العلامة التجارية / اسم المنتج"
   │  └─ factory ← "مصانع / معامل / متاجر إلكترونية / محلات تجارية / مولات / ورشات"
   │
   ├─ if subtype == "other"
   │  └─ orgSubTypeOther  ← free text "حدد النوع (غير ذلك)"
   │
   └─ entityName  ← "اسم العلامة التجارية / المنتج" (for brand) (one of these is required - item 1)
                    or "اسم المنشأة / الجهة" (for factory) (one of these is required - item 2)

3. location-info
   ├─ country        ← dropdown, e.g. "سوريا" requreid
   ├─ governorate    ← dropdown (if Syria), e.g. "دمشق" required
   ├─ address        ← text "العنوان (المنطقة، الحي، الشارع...)" opitional
   ├─ contactPhoneCountryCode + contactPhone (one of these is required at least - item 1)
   ├─ entityEmail    ← "البريد الإلكتروني للجهة" (one of these is required at least - item 2)
   ├─ websiteName    ← "رابط الموقع الإلكتروني للجهة" (one of these is required at least - item 3)
   ├─ googleMapsLink ← "رابط Google Maps (اختياري)" (one of these is required at least - item 4)
   └─ socialContactMethods (one of these is required at least - item 5)
      └─ repeated rows of {type, value} 
         types: x / facebook / instagram / telegram / whatsapp / tiktok / website

4. report-details
   ├─ detailFlags (multi-select cards)
   │  ├─ owner        → surfaces ownerNames array (one of these is required at least - item 1)
   │  ├─ investor     → surfaces investorNames array (one of these is required at least - item 2)
   │  ├─ labour       → surfaces labourEntries array [{name, role}] (one of these is required at least - item 3)
   │  └─ support_data → surfaces supportDataInfo text (max 256) (one of these is required at least - item 4)
   │
   ├─ subtype-driven fields
   │  └─ ownerNames (array)  ← because commercial subtypes brand/factory always show ownerNames
   │
   └─ flag-driven fields (when selected)
      ├─ ownerNames        ← array, label "المالك / الشريك / الشركاء"
      ├─ investorNames     ← array, label "المستثمر / المستثمرون"
      ├─ labourEntries     ← array of {name, role}, label "عمال / موظفون"
      └─ supportDataInfo   ← text, label "غير ذلك"

5. experience
   ├─ allegationDescription  ← textarea "صف تجربتك / ما حصل" (min 20 chars) required
   └─ supportingDocuments    ← multi-select cards optional
      ├─ photos
      ├─ videos
      ├─ audio
      ├─ documents
      ├─ screenshots
      └─ other

6. media-evidence
   ├─ mediaLink      ← URL "رابط لأي فيديوهات أو مستندات..." optional
   ├─ sourceFiles    ← drag-and-drop / file picker optional
   │  └─ each file: originalName, size, url, label ("اسم الوسيط") optional
   └─ mediaNotes     ← textarea "ملاحظات إضافية" optional

7. about-you
   ├─ isAnonymous    ← toggle "التقديم بشكل مجهول" (default ON) 
   └─ if isAnonymous == false
      ├─ submitterName      ← "الاسم الكامل"
      └─ contactMethods     ← repeated rows {type, value}
         types: x / facebook / instagram / telegram / whatsapp / tiktok / phone / email / website

8. review
   └─ read-only summary + affirmation checkbox + submit
```

---

## 4. Full Possible Field Tree (Commercial only)

```
commercial
├─ entityType          = "organization"
├─ entityName          ← text
├─ reportCategory      = "commercial"
├─ reportMetadata
│  ├─ orgType          = "brand" | "factory" | "other"
│  ├─ orgSubTypeOther  ← text (only if orgType == "other")
│  ├─ country          ← text
│  ├─ governorate      ← text
│  ├─ address          ← text
│  ├─ contactPhoneCountryCode ← text
│  ├─ contactPhone     ← text
│  ├─ entityEmail      ← email
│  ├─ websiteName      ← url
│  ├─ googleMapsLink   ← url
│  ├─ socialContactMethods ← array of {type, value}
│  ├─ detailFlags      ← array [owner, investor, labour, support_data, ...]
│  ├─ ownerNames       ← array of strings
│  ├─ investorNames    ← array of strings
│  ├─ labourEntries    ← array of {name, role}
│  ├─ supportDataInfo  ← text (max 256)
│  ├─ supportingDocuments ← array [photos, videos, audio, documents, screenshots, other]
│  ├─ mediaLink        ← url
│  ├─ mediaNotes       ← text
│  └─ contactMethods   ← array of {type, value} (submitter, optional)
├─ allegationDescription ← text (min 20 chars)
├─ sourceFiles         ← array of {hash, filename, originalName, url, size, label}
├─ submitterName       ← text (if not anonymous)
├─ submitterEmail      ← email (auto-filled from contactMethods email)
├─ isAnonymous         ← boolean
└─ entityRole          ← text (auto-generated Arabic subtype label)
```

---

## 5. Notes

- The `individuals` category does NOT show the `entityName` field; instead it relies on `reportedPersonName` in report-details.
- Some subtypes have special detail-field sets, e.g. tourism → taxi/private_car shows car/plate/driver/app fields.
- Some subtypes exclude certain detail flags (e.g. tourism/private_car excludes owner/investor/labour/support_data).
- `tourism/properties` redirects the category to `real_estate` internally.
- All source links are no longer collected at intake; only public media links and file uploads are accepted.
