/**
 * Category-based report wizard configuration (v1.5).
 *
 * Pure constants module: NO JSX, NO React. Closed option sets per report category
 * plus per-subtype detail schemas so step 4 shows only the relevant fields.
 * Icons are referenced by name string and resolved to Lucide components in the UI.
 *
 * v1.5 localization: all user-visible labels are stored as `submit.*` i18n keys
 * in messages/en.json and messages/ar.json. This file no longer contains
 * hardcoded Arabic or English labels.
 */

import type { ReportCategory, ReportMetadata } from "@/lib/validation";
import arMessages from "../../../messages/ar.json";
import * as countryCodesList from "country-codes-list";
import worldCountries from "world-countries";

export type DetailFieldId =
  | "ownerName"
  | "ownerNames"
  | "reportedPersonName"
  | "professorName"
  | "universityDoctorName"
  | "reportedPersonNickname"
  | "reportedPersonPhone"
  | "reportedPersonPosition"
  | "reportedPersonSocialMedia"
  | "carType"
  | "carPlate"
  | "driverPhone"
  | "driverName"
  | "taxiNumber"
  | "appName"
  | "propertyType"
  | "partnerName"
  | "investorName"
  | "investorNames"
  | "receptionInfo"
  | "labourInfo"
  | "labourEntries"
  | "supportDataInfo"
  | "clubName"
  | "academicStaff"
  | "doctors"
  | "nurses"
  | "members";

export interface LocalizedOption {
  value: string;
  labelKey?: string;
  descriptionKey?: string;
  iconName?: string;
  countryCode?: string;
}

export interface SubTypeConfig extends LocalizedOption {
  /** Which free-text detail fields to show for this subtype. */
  detailFields: DetailFieldId[];
  /** Detail-flag values that should NOT be offered for this subtype. */
  excludedDetailFlags?: string[];
}

export interface CategoryConfig {
  id: ReportCategory;
  labelKey: string;
  descriptionKey: string;
  iconName: string;
  entityType: "individual" | "organization";
  subTypes: SubTypeConfig[];
  /** Card options shown in Step 4 ("نوع البلاغ"). */
  detailFlags: LocalizedOption[];
}

/** Translation function shape for the `submit` namespace. */
type SubmitT = (key: string) => string;

const arSubmit = arMessages.submit as Record<string, string>;

function arLabel(key: string): string {
  return arSubmit[key] ?? key;
}

const COMMON_FLAGS: Record<string, LocalizedOption> = {
  owner: { value: "owner", labelKey: "flagOwner", iconName: "UserCog" },
  labour: { value: "labour", labelKey: "flagLabour", iconName: "Users" },
  supportData: { value: "support_data", labelKey: "flagSupportData", iconName: "FileText" },
  academicStaff: { value: "academic_staff", labelKey: "flagAcademicStaff", iconName: "GraduationCap" },
  member: { value: "member", labelKey: "flagMember", iconName: "Users" },
  doctor: { value: "doctor", labelKey: "flagDoctor", iconName: "Stethoscope" },
  nurse: { value: "nurse", labelKey: "flagNurse", iconName: "HeartPulse" },
  investor: { value: "investor", labelKey: "flagInvestor", iconName: "TrendingUp" },
  student: { value: "student", labelKey: "flagStudent", iconName: "GraduationCap" },
  clubName: { value: "club_name", labelKey: "flagClubName", iconName: "Flag" },
};

export const REPORT_CATEGORIES: ReadonlyArray<CategoryConfig> = [
  {
    id: "commercial",
    labelKey: "catCommercial",
    descriptionKey: "catCommercialDesc",
    iconName: "Store",
    entityType: "organization",
    subTypes: [
      {
        value: "brand",
        labelKey: "subCommercialBrand",
        descriptionKey: "subCommercialBrandDesc",
        iconName: "Tag",
        detailFields: ["ownerNames"],
      },
      {
        value: "factory",
        labelKey: "subCommercialFactory",
        descriptionKey: "subCommercialFactoryDesc",
        iconName: "Factory",
        detailFields: ["ownerNames"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.investor, COMMON_FLAGS.labour, COMMON_FLAGS.supportData],
  },
  {
    id: "individuals",
    labelKey: "catIndividuals",
    descriptionKey: "catIndividualsDesc",
    iconName: "User",
    entityType: "individual",
    subTypes: [
      {
        value: "street_vendor",
        labelKey: "subIndividualsStreetVendor",
        descriptionKey: "subIndividualsStreetVendorDesc",
        iconName: "ShoppingBag",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "driver",
        labelKey: "subIndividualsDriver",
        descriptionKey: "subIndividualsDriverDesc",
        iconName: "Car",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "cleaner",
        labelKey: "subIndividualsCleaner",
        descriptionKey: "subIndividualsCleanerDesc",
        iconName: "Sparkles",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "shabbiha",
        labelKey: "subIndividualsShabbiha",
        descriptionKey: "subIndividualsShabbihaDesc",
        iconName: "ShieldAlert",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "volunteer",
        labelKey: "subIndividualsVolunteer",
        descriptionKey: "subIndividualsVolunteerDesc",
        iconName: "UserCheck",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "university_student",
        labelKey: "subIndividualsUniversityStudent",
        descriptionKey: "subIndividualsUniversityStudentDesc",
        iconName: "GraduationCap",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "influencer",
        labelKey: "subIndividualsInfluencer",
        descriptionKey: "subIndividualsInfluencerDesc",
        iconName: "Smartphone",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "gov_employee",
        labelKey: "subIndividualsGovEmployee",
        descriptionKey: "subIndividualsGovEmployeeDesc",
        iconName: "Landmark",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "private_employee",
        labelKey: "subIndividualsPrivateEmployee",
        descriptionKey: "subIndividualsPrivateEmployeeDesc",
        iconName: "Briefcase",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "kiosk",
        labelKey: "subIndividualsKiosk",
        descriptionKey: "subIndividualsKioskDesc",
        iconName: "Store",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "delivery_app",
        labelKey: "subIndividualsDeliveryApp",
        descriptionKey: "subIndividualsDeliveryAppDesc",
        iconName: "Truck",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "craftsman",
        labelKey: "subIndividualsCraftsman",
        descriptionKey: "subIndividualsCraftsmanDesc",
        iconName: "Wrench",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "other",
        labelKey: "subIndividualsOther",
        descriptionKey: "subIndividualsOtherDesc",
        iconName: "HelpCircle",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
      },
    ],
    detailFlags: [],
  },
  {
    id: "educational",
    labelKey: "catEducational",
    descriptionKey: "catEducationalDesc",
    iconName: "GraduationCap",
    entityType: "organization",
    subTypes: [
      {
        value: "academy",
        labelKey: "subEducationalAcademy",
        descriptionKey: "subEducationalAcademyDesc",
        iconName: "School",
        detailFields: ["ownerNames"],
      },
      {
        value: "institute",
        labelKey: "subEducationalInstitute",
        descriptionKey: "subEducationalInstituteDesc",
        iconName: "Building",
        detailFields: ["ownerNames"],
      },
      {
        value: "course",
        labelKey: "subEducationalCourse",
        descriptionKey: "subEducationalCourseDesc",
        iconName: "BookOpen",
        detailFields: ["ownerNames"],
      },
      {
        value: "schools",
        labelKey: "subEducationalSchools",
        descriptionKey: "subEducationalSchoolsDesc",
        iconName: "School",
        detailFields: ["ownerNames"],
      },
      {
        value: "universities",
        labelKey: "subEducationalUniversities",
        descriptionKey: "subEducationalUniversitiesDesc",
        iconName: "GraduationCap",
        detailFields: ["ownerNames"],
      },
      {
        value: "kindergarten",
        labelKey: "subEducationalKindergarten",
        descriptionKey: "subEducationalKindergartenDesc",
        iconName: "Baby",
        detailFields: ["ownerNames"],
      },
    ],
    detailFlags: [
      COMMON_FLAGS.owner,
      COMMON_FLAGS.investor,
      COMMON_FLAGS.labour,
      COMMON_FLAGS.academicStaff,
      COMMON_FLAGS.supportData,
    ],
  },
  {
    id: "service",
    labelKey: "catService",
    descriptionKey: "catServiceDesc",
    iconName: "Wrench",
    entityType: "organization",
    subTypes: [
      {
        value: "cleaning_office",
        labelKey: "subServiceCleaningOffice",
        descriptionKey: "subServiceCleaningOfficeDesc",
        iconName: "Sparkles",
        detailFields: ["ownerNames"],
      },
      {
        value: "delivery_app",
        labelKey: "subServiceDeliveryApp",
        descriptionKey: "subServiceDeliveryAppDesc",
        iconName: "Truck",
        detailFields: ["ownerNames"],
      },
      {
        value: "beauty_center",
        labelKey: "subServiceBeautyCenter",
        descriptionKey: "subServiceBeautyCenterDesc",
        iconName: "Scissors",
        detailFields: ["ownerNames"],
      },
      {
        value: "massage",
        labelKey: "subServiceMassage",
        descriptionKey: "subServiceMassageDesc",
        iconName: "Hand",
        detailFields: ["ownerNames"],
      },
      {
        value: "barber",
        labelKey: "subServiceBarber",
        descriptionKey: "subServiceBarberDesc",
        iconName: "Scissors",
        detailFields: ["ownerNames"],
      },
      {
        value: "laundry",
        labelKey: "subServiceLaundry",
        descriptionKey: "subServiceLaundryDesc",
        iconName: "Shirt",
        detailFields: ["ownerNames"],
      },
      {
        value: "club",
        labelKey: "subServiceClub",
        descriptionKey: "subServiceClubDesc",
        iconName: "Users",
        detailFields: ["ownerNames"],
      },
      {
        value: "renovation",
        labelKey: "subServiceRenovation",
        descriptionKey: "subServiceRenovationDesc",
        iconName: "Hammer",
        detailFields: ["ownerNames"],
      },
      {
        value: "import_export",
        labelKey: "subServiceImportExport",
        descriptionKey: "subServiceImportExportDesc",
        iconName: "Ship",
        detailFields: ["ownerNames"],
      },
      {
        value: "exchange",
        labelKey: "subServiceExchange",
        descriptionKey: "subServiceExchangeDesc",
        iconName: "Banknote",
        detailFields: ["ownerNames"],
      },
      {
        value: "tech_company",
        labelKey: "subServiceTechCompany",
        descriptionKey: "subServiceTechCompanyDesc",
        iconName: "Cpu",
        detailFields: ["ownerNames"],
      },
      {
        value: "wedding_hall",
        labelKey: "subServiceWeddingHall",
        descriptionKey: "subServiceWeddingHallDesc",
        iconName: "PartyPopper",
        detailFields: ["ownerNames"],
      },
      {
        value: "other",
        labelKey: "subServiceOther",
        descriptionKey: "subServiceOtherDesc",
        iconName: "HelpCircle",
        detailFields: ["ownerNames"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.investor, COMMON_FLAGS.labour, COMMON_FLAGS.supportData],
  },
  {
    id: "tourism",
    labelKey: "catTourism",
    descriptionKey: "catTourismDesc",
    iconName: "Plane",
    entityType: "organization",
    subTypes: [
      {
        value: "travel_company",
        labelKey: "subTourismTravelCompany",
        descriptionKey: "subTourismTravelCompanyDesc",
        iconName: "Plane",
        detailFields: ["ownerNames"],
      },
      {
        value: "properties",
        labelKey: "subTourismProperties",
        descriptionKey: "subTourismPropertiesDesc",
        iconName: "Home",
        detailFields: ["ownerNames"],
      },
      {
        value: "hotel",
        labelKey: "subTourismHotel",
        descriptionKey: "subTourismHotelDesc",
        iconName: "Hotel",
        detailFields: ["ownerNames"],
      },
      {
        value: "restaurant_cafe",
        labelKey: "subTourismRestaurantCafe",
        descriptionKey: "subTourismRestaurantCafeDesc",
        iconName: "UtensilsCrossed",
        detailFields: ["ownerNames"],
      },
      {
        value: "taxi",
        labelKey: "subTourismTaxi",
        descriptionKey: "subTourismTaxiDesc",
        iconName: "Taxi",
        detailFields: ["carType", "carPlate", "driverPhone", "driverName", "taxiNumber", "appName"],
      },
      {
        value: "car_rental",
        labelKey: "subTourismCarRental",
        descriptionKey: "subTourismCarRentalDesc",
        iconName: "Car",
        detailFields: ["ownerNames"],
      },
      {
        value: "private_car",
        labelKey: "subTourismPrivateCar",
        descriptionKey: "subTourismPrivateCarDesc",
        iconName: "Car",
        detailFields: ["carType", "carPlate", "driverPhone", "driverName", "taxiNumber", "appName"],
        excludedDetailFlags: ["owner", "investor", "labour", "support_data"],
      },
    ],
    detailFlags: [
      COMMON_FLAGS.owner,
      COMMON_FLAGS.investor,
      COMMON_FLAGS.labour,
      COMMON_FLAGS.supportData,
    ],
  },
  {
    id: "medical",
    labelKey: "catMedical",
    descriptionKey: "catMedicalDesc",
    iconName: "Stethoscope",
    entityType: "organization",
    subTypes: [
      {
        value: "pharmacy",
        labelKey: "subMedicalPharmacy",
        descriptionKey: "subMedicalPharmacyDesc",
        iconName: "Pill",
        detailFields: ["ownerNames"],
        excludedDetailFlags: ["doctor", "nurse"],
      },
      {
        value: "personal_clinic",
        labelKey: "subMedicalPersonalClinic",
        descriptionKey: "subMedicalPersonalClinicDesc",
        iconName: "Stethoscope",
        detailFields: ["ownerNames"],
      },
      {
        value: "private_hospital",
        labelKey: "subMedicalPrivateHospital",
        descriptionKey: "subMedicalPrivateHospitalDesc",
        iconName: "Hospital",
        detailFields: ["ownerNames"],
      },
      {
        value: "medical_center",
        labelKey: "subMedicalMedicalCenter",
        descriptionKey: "subMedicalMedicalCenterDesc",
        iconName: "HeartPulse",
        detailFields: ["ownerNames"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.investor, COMMON_FLAGS.labour, COMMON_FLAGS.doctor, COMMON_FLAGS.nurse, COMMON_FLAGS.supportData],
  },
  {
    id: "organizations",
    labelKey: "catOrganizations",
    descriptionKey: "catOrganizationsDesc",
    iconName: "Building2",
    entityType: "organization",
    subTypes: [
      {
        value: "civil_society",
        labelKey: "subOrganizationsCivilSociety",
        descriptionKey: "subOrganizationsCivilSocietyDesc",
        iconName: "Users",
        detailFields: ["ownerNames"],
        excludedDetailFlags: ["club_name", "student", "member"],
      },
      {
        value: "social_media_company",
        labelKey: "subOrganizationsSocialMediaCompany",
        descriptionKey: "subOrganizationsSocialMediaCompanyDesc",
        iconName: "Globe",
        detailFields: ["ownerNames"],
        excludedDetailFlags: ["club_name", "student", "member"],
      },
      {
        value: "media_institution",
        labelKey: "subOrganizationsMediaInstitution",
        descriptionKey: "subOrganizationsMediaInstitutionDesc",
        iconName: "Radio",
        detailFields: ["ownerNames"],
        excludedDetailFlags: ["club_name", "student", "member"],
      },
      {
        value: "quasi_governmental",
        labelKey: "subOrganizationsQuasiGovernmental",
        descriptionKey: "subOrganizationsQuasiGovernmentalDesc",
        iconName: "Building2",
        detailFields: [],
        excludedDetailFlags: ["owner", "investor", "club_name", "student"],
      },
      {
        value: "association",
        labelKey: "subOrganizationsAssociation",
        descriptionKey: "subOrganizationsAssociationDesc",
        iconName: "Handshake",
        detailFields: ["ownerNames"],
        excludedDetailFlags: ["club_name", "student", "member"],
      },
      {
        value: "student_club",
        labelKey: "subOrganizationsStudentClub",
        descriptionKey: "subOrganizationsStudentClubDesc",
        iconName: "UsersRound",
        detailFields: ["reportedPersonName", "reportedPersonPosition"],
        excludedDetailFlags: ["owner", "investor", "member"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.labour, COMMON_FLAGS.clubName, COMMON_FLAGS.investor, COMMON_FLAGS.student, COMMON_FLAGS.member, COMMON_FLAGS.supportData],
  },
  {
    id: "real_estate",
    labelKey: "catRealEstate",
    descriptionKey: "catRealEstateDesc",
    iconName: "Home",
    entityType: "organization",
    subTypes: [
      {
        value: "house",
        labelKey: "subRealEstateHouse",
        descriptionKey: "subRealEstateHouseDesc",
        iconName: "Home",
        detailFields: ["ownerNames"],
      },
      {
        value: "apartment",
        labelKey: "subRealEstateApartment",
        descriptionKey: "subRealEstateApartmentDesc",
        iconName: "Building",
        detailFields: ["ownerNames"],
      },
      {
        value: "villa",
        labelKey: "subRealEstateVilla",
        descriptionKey: "subRealEstateVillaDesc",
        iconName: "Castle",
        detailFields: ["ownerNames"],
      },
      {
        value: "chalet",
        labelKey: "subRealEstateChalet",
        descriptionKey: "subRealEstateChaletDesc",
        iconName: "TreePine",
        detailFields: ["ownerNames"],
      },
      {
        value: "farm",
        labelKey: "subRealEstateFarm",
        descriptionKey: "subRealEstateFarmDesc",
        iconName: "Wheat",
        detailFields: ["ownerNames"],
      },
      {
        value: "land",
        labelKey: "subRealEstateLand",
        descriptionKey: "subRealEstateLandDesc",
        iconName: "Map",
        detailFields: ["ownerNames"],
      },
      {
        value: "shop",
        labelKey: "subRealEstateShop",
        descriptionKey: "subRealEstateShopDesc",
        iconName: "Store",
        detailFields: ["ownerNames"],
      },
      {
        value: "office",
        labelKey: "subRealEstateOffice",
        descriptionKey: "subRealEstateOfficeDesc",
        iconName: "Building2",
        detailFields: ["ownerNames"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.investor, COMMON_FLAGS.supportData],
  },
];

function getArabicCommonName(country: (typeof worldCountries)[number]): string {
  return country.translations.ara?.common ?? country.translations.ara?.official ?? country.name.common;
}

/** Country options for Step 2. Values are kept in Arabic to avoid breaking existing data. */
export const COUNTRIES: ReadonlyArray<LocalizedOption> = (() => {
  const list = worldCountries
    .filter((c) => c.cca2 !== "IL")
    .map((c) => {
      const arabicName = getArabicCommonName(c);
      const value = c.cca2 === "PS" ? "فلسطين (الأراضي المحتلة)" : arabicName;
      return {
        value,
        countryCode: c.cca2,
      };
    })
    .sort((a, b) => a.value.localeCompare(b.value, "ar"));

  return [...list, { value: "أخرى", labelKey: "countryOther" }];
})();

const CALLING_CODE_BY_CCA2: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const records = countryCodesList.customArray({
    countryCode: "{countryCode}",
    countryCallingCode: "{countryCallingCode}",
  });
  for (const r of records) {
    if (r.countryCallingCode) {
      map[r.countryCode] = `+${r.countryCallingCode}`;
    }
  }
  return map;
})();

/** Country dialing codes keyed by the Arabic country names used in COUNTRIES. */
export const COUNTRY_DIAL_CODES: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const c of worldCountries) {
    if (c.cca2 === "IL") continue;
    const arabicName = getArabicCommonName(c);
    const value = c.cca2 === "PS" ? "فلسطين (الأراضي المحتلة)" : arabicName;
    const dial = c.cca2 === "PS" ? "+970" : CALLING_CODE_BY_CCA2[c.cca2];
    if (dial) map[value] = dial;
  }
  map["أخرى"] = "";
  return map;
})();

/** Syrian governorates for Step 2. Values are kept in Arabic; labels are localized. */
export const SYRIAN_GOVERNORATES: ReadonlyArray<LocalizedOption> = [
  { value: "دمشق", labelKey: "govDamascus" },
  { value: "ريف دمشق", labelKey: "govRifDamascus" },
  { value: "حلب", labelKey: "govAleppo" },
  { value: "حمص", labelKey: "govHoms" },
  { value: "حماة", labelKey: "govHama" },
  { value: "اللاذقية", labelKey: "govLatakia" },
  { value: "طرطوس", labelKey: "govTartus" },
  { value: "دير الزور", labelKey: "govDeirEzzor" },
  { value: "الرقة", labelKey: "govRaqqa" },
  { value: "الحسكة", labelKey: "govHasakah" },
  { value: "القنيطرة", labelKey: "govQuneitra" },
  { value: "السويداء", labelKey: "govSweida" },
  { value: "درعا", labelKey: "govDaraa" },
  { value: "إدلب", labelKey: "govIdlib" },
];

export const CATEGORY_BY_ID: Readonly<Record<ReportCategory, CategoryConfig>> =
  REPORT_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<ReportCategory, CategoryConfig>);

export function getCategoryConfig(category: ReportCategory | string | undefined): CategoryConfig | undefined {
  if (!category) return undefined;
  return CATEGORY_BY_ID[category as ReportCategory];
}

export function getSubTypeConfig(categoryId: ReportCategory | string | undefined, subTypeValue: string | undefined): SubTypeConfig | undefined {
  const cat = getCategoryConfig(categoryId);
  if (!cat || !subTypeValue) return undefined;
  return cat.subTypes.find((s) => s.value === subTypeValue);
}

/** Resolves the localized label for a report category. */
export function getCategoryLabel(t: SubmitT, category: ReportCategory | string | undefined): string {
  const cat = getCategoryConfig(category);
  return cat ? t(cat.labelKey) : String(category ?? "");
}

/** Resolves the localized description for a report category. */
export function getCategoryDescription(t: SubmitT, category: ReportCategory | string | undefined): string {
  const cat = getCategoryConfig(category);
  return cat && cat.descriptionKey ? t(cat.descriptionKey) : "";
}

/** Resolves the localized label for a subtype. */
export function getSubTypeLabel(t: SubmitT, categoryId: ReportCategory | string | undefined, subTypeValue: string | undefined): string {
  const sub = getSubTypeConfig(categoryId, subTypeValue);
  return sub ? t(sub.labelKey ?? sub.value) : String(subTypeValue ?? "");
}

/** Resolves the localized description for a subtype. */
export function getSubTypeDescription(t: SubmitT, categoryId: ReportCategory | string | undefined, subTypeValue: string | undefined): string {
  const sub = getSubTypeConfig(categoryId, subTypeValue);
  return sub && sub.descriptionKey ? t(sub.descriptionKey) : "";
}

/** Resolves the Arabic label for a subtype (used for the internal `entityRole` field). */
export function getSubTypeLabelAr(categoryId: ReportCategory | string | undefined, subTypeValue: string | undefined): string {
  const sub = getSubTypeConfig(categoryId, subTypeValue);
  return sub ? arLabel(sub.labelKey ?? sub.value) : String(subTypeValue ?? "");
}

/** Resolves the localized label for a detail flag. */
export function getFlagLabel(t: SubmitT, flagValue: string | undefined): string {
  const flag = Object.values(COMMON_FLAGS).find((f) => f.value === flagValue);
  return flag ? t(flag.labelKey ?? flag.value) : String(flagValue ?? "");
}

/** Resolves the localized label for a supporting-document option. */
export function getDocumentLabel(t: SubmitT, docValue: string | undefined): string {
  const doc = SUPPORTING_DOCUMENT_OPTIONS.find((d) => d.value === docValue);
  return doc ? t(doc.labelKey ?? doc.value) : String(docValue ?? "");
}

/** Resolves the localized label for a country option (with flag emoji). */
export function getCountryLabel(t: SubmitT, locale: string, countryValue: string | undefined): string {
  const country = COUNTRIES.find((c) => c.value === countryValue);
  if (!country) return String(countryValue ?? "");
  if (countryValue === "أخرى") return t("countryOther");
  if (country.countryCode) {
    const flag = getFlagEmoji(country.countryCode);
    const name = country.countryCode === "PS"
      ? (locale === "ar" ? "فلسطين (الأراضي المحتلة)" : "Palestine (Occupied Territory)")
      : new Intl.DisplayNames(locale, { type: "region" }).of(country.countryCode);
    return `${flag} ${name}`;
  }
  return country.labelKey ? t(country.labelKey) : String(countryValue ?? "");
}

function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/** Resolves the localized label for a Syrian governorate. */
export function getGovernorateLabel(t: SubmitT, governorateValue: string | undefined): string {
  const gov = SYRIAN_GOVERNORATES.find((g) => g.value === governorateValue);
  return gov ? t(gov.labelKey ?? gov.value) : String(governorateValue ?? "");
}

/** Maps each selectable detail flag to the metadata field it surfaces and its i18n label key. */
export const DETAIL_FLAG_FIELDS: Record<string, { field: keyof ReportMetadata; labelKey: string }> = {
  owner: { field: "ownerNames", labelKey: "detailsOwnerName" },
  investor: { field: "investorNames", labelKey: "detailsInvestorName" },
  labour: { field: "labourEntries", labelKey: "detailsLabourInfo" },
  support_data: { field: "supportDataInfo", labelKey: "detailsSupportDataInfo" },
  club_name: { field: "clubName", labelKey: "detailsClubName" },
  academic_staff: { field: "academicStaff", labelKey: "detailsAcademicStaff" },
  member: { field: "members", labelKey: "detailsMembers" },
  instructor: { field: "reportedPersonName", labelKey: "detailsReportedName" },
  professor: { field: "professorName", labelKey: "detailsProfessorName" },
  university_doctor: { field: "universityDoctorName", labelKey: "detailsUniversityDoctorName" },
  doctor: { field: "doctors", labelKey: "detailsDoctors" },
  nurse: { field: "nurses", labelKey: "detailsNurses" },
  student: { field: "reportedPersonName", labelKey: "detailsReportedName" },
};

/** Canonical display order for detail fields on the review screen. */
const DETAIL_FIELD_ORDER: DetailFieldId[] = [
  "ownerNames",
  "investorNames",
  "academicStaff",
  "doctors",
  "nurses",
  "members",
  "reportedPersonName",
  "professorName",
  "universityDoctorName",
  "reportedPersonNickname",
  "reportedPersonPhone",
  "reportedPersonPosition",
  "reportedPersonSocialMedia",
  "carType",
  "carPlate",
  "driverPhone",
  "driverName",
  "taxiNumber",
  "appName",
  "propertyType",
  "labourEntries",
  "supportDataInfo",
  "clubName",
];

/**
 * Returns the detail field IDs that should be shown for a given category/subtype,
 * including any fields surfaced by selected detail flags. The result is deduplicated
 * and ordered according to DETAIL_FIELD_ORDER.
 */
export function getRelevantDetailFieldIds(
  categoryId: ReportCategory | string | undefined,
  orgType: string | undefined,
  detailFlags: string[] | undefined,
): DetailFieldId[] {
  const subTypeConfig = getSubTypeConfig(categoryId, orgType);
  const relevant = new Set<DetailFieldId>(subTypeConfig?.detailFields ?? []);
  for (const flag of detailFlags ?? []) {
    const mapping = DETAIL_FLAG_FIELDS[flag];
    if (mapping) {
      relevant.add(mapping.field as DetailFieldId);
    }
  }
  return DETAIL_FIELD_ORDER.filter((id) => relevant.has(id));
}

/** Default supporting-document checkbox options for Step 5 (تجربتك). */
export const SUPPORTING_DOCUMENT_OPTIONS: ReadonlyArray<LocalizedOption> = [
  { value: "photos", labelKey: "docPhotos", iconName: "Image" },
  { value: "videos", labelKey: "docVideos", iconName: "Video" },
  { value: "audio", labelKey: "docAudio", iconName: "Mic" },
  { value: "documents", labelKey: "docDocuments", iconName: "FileText" },
  { value: "screenshots", labelKey: "docScreenshots", iconName: "Monitor" },
  { value: "other", labelKey: "docOther", iconName: "FileQuestion" },
];
