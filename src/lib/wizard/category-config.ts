/**
 * Category-based report wizard configuration (v1.5).
 *
 * Pure constants module: NO JSX, NO React. Closed option sets per report category
 * plus per-subtype detail schemas so step 4 shows only the relevant fields.
 * Icons are referenced by name string and resolved to Lucide components in the UI.
 */

import type { ReportCategory } from "@/lib/validation";

export type DetailFieldId =
  | "ownerName"
  | "reportedPersonName"
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
  | "propertyType";

export interface CategoryOption {
  value: string;
  labelAr: string;
  labelEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconName?: string;
}

export interface SubTypeConfig extends CategoryOption {
  /** Which free-text detail fields to show for this subtype. */
  detailFields: DetailFieldId[];
}

export interface CategoryConfig {
  id: ReportCategory;
  labelAr: string;
  labelEn: string;
  /** Short subtext shown under the category card title. */
  descAr: string;
  descEn: string;
  iconName: string;
  entityType: "individual" | "organization";
  subTypes: SubTypeConfig[];
  /** Card options shown in Step 4 ("نوع البلاغ"). */
  detailFlags: CategoryOption[];
}

const COMMON_FLAGS = {
  owner: { value: "owner", labelAr: "المالك / الشركاء", iconName: "UserCog" },
  reception: { value: "reception", labelAr: "استقبال / مكتب أمامي", iconName: "Headphones" },
  labour: { value: "labour", labelAr: "عمال / موظفون", iconName: "Users" },
  supportData: { value: "support_data", labelAr: "أي بيانات داعمة", iconName: "FileText" },
  doctor: { value: "doctor", labelAr: "طبيب / دكتور", iconName: "Stethoscope" },
  nurse: { value: "nurse", labelAr: "ممرض / ممرضة", iconName: "HeartPulse" },
  instructor: { value: "instructor", labelAr: "اسم المدرب / الأستاذ", iconName: "UserCheck" },
  investor: { value: "investor", labelAr: "مستثمر / رئيس النادي", iconName: "TrendingUp" },
  student: { value: "student", labelAr: "طالب", iconName: "GraduationCap" },
  clubName: { value: "club_name", labelAr: "اسم النادي / الجمعية", iconName: "Flag" },
};

export const REPORT_CATEGORIES: ReadonlyArray<CategoryConfig> = [
  {
    id: "commercial",
    labelAr: "تجاري",
    labelEn: "Commercial",
    descAr: "متاجر، مصانع، علامات تجارية، محلات ومولات",
    descEn: "Shops, factories, brands, stores and malls",
    iconName: "Store",
    entityType: "organization",
    subTypes: [
      {
        value: "brand",
        labelAr: "براند / اسم العلامة التجارية / اسم المنتج",
        descriptionAr: "بلاغ عن منتج أو علامة تجارية محددة",
        descriptionEn: "Report about a specific product or brand",
        iconName: "Tag",
        detailFields: ["ownerName"],
      },
      {
        value: "factory",
        labelAr: "مصانع / معامل / متاجر إلكترونية / محلات تجارية / مولات / ورشات",
        descriptionAr: "بلاغ عن منشأة تجارية أو مصنع أو متجر",
        descriptionEn: "Report about a commercial facility, factory or shop",
        iconName: "Factory",
        detailFields: ["ownerName"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.reception, COMMON_FLAGS.labour, COMMON_FLAGS.supportData],
  },
  {
    id: "individuals",
    labelAr: "أفراد",
    labelEn: "Individuals",
    descAr: "بائعون، سائقون، موظفون، مؤثرون، عمال نظافة",
    descEn: "Vendors, drivers, employees, influencers, cleaners",
    iconName: "User",
    entityType: "individual",
    subTypes: [
      {
        value: "street_vendor",
        labelAr: "باعة جوالة",
        descriptionAr: "بائع متنقل في الأسواق أو الشوارع",
        descriptionEn: "Mobile vendor in markets or streets",
        iconName: "ShoppingBag",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "driver",
        labelAr: "سائق سيرفيس / شحن / خاص / توصيل",
        descriptionAr: "سائق سيارة أجرة، شحن، توصيل أو خاص",
        descriptionEn: "Taxi, shipping, delivery or private driver",
        iconName: "Car",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "cleaner",
        labelAr: "عاملة تنظيف",
        descriptionAr: "عاملة نظافة منزلية أو مكتبية",
        descriptionEn: "Domestic or office cleaner",
        iconName: "Sparkles",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "shabbiha",
        labelAr: "شبيح",
        descriptionAr: "شخص مرتبط بأنشطة النظام السابق",
        descriptionEn: "Person linked to former regime activity",
        iconName: "ShieldAlert",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "influencer",
        labelAr: "مؤثر / حساب سوشال ميديا",
        descriptionAr: "حساب أو شخص مؤثر على وسائل التواصل",
        descriptionEn: "Social media account or influencer",
        iconName: "Smartphone",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "gov_employee",
        labelAr: "موظف حكومي",
        descriptionAr: "موظف في جهة حكومية أو عامة",
        descriptionEn: "Government or public sector employee",
        iconName: "Landmark",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "private_employee",
        labelAr: "موظف قطاع خاص",
        descriptionAr: "موظف في شركة أو مؤسسة خاصة",
        descriptionEn: "Private sector employee",
        iconName: "Briefcase",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "kiosk",
        labelAr: "أكشاك",
        descriptionAr: "صاحب كشك في الشارع أو السوق",
        descriptionEn: "Street or market kiosk operator",
        iconName: "Store",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
      {
        value: "delivery_app",
        labelAr: "تطبيقات توصيل",
        descriptionAr: "مندوب توصيل عبر تطبيق",
        descriptionEn: "App delivery courier",
        iconName: "Truck",
        detailFields: ["reportedPersonName", "reportedPersonPhone", "reportedPersonPosition", "reportedPersonSocialMedia"],
      },
    ],
    detailFlags: [
      { value: "name", labelAr: "الاسم / الكنية", iconName: "User" },
      { value: "phone", labelAr: "رقم الهاتف", iconName: "Phone" },
      { value: "position", labelAr: "المنصب / المهنة", iconName: "IdCard" },
      { value: "social", labelAr: "حسابات سوشال ميديا", iconName: "Share2" },
    ],
  },
  {
    id: "educational",
    labelAr: "تعليمي",
    labelEn: "Educational",
    descAr: "أكاديميات، معاهد، كورسات، أساتذة وروضات",
    descEn: "Academies, institutes, courses, professors and kindergartens",
    iconName: "GraduationCap",
    entityType: "organization",
    subTypes: [
      {
        value: "academy",
        labelAr: "أكاديميات",
        descriptionAr: "أكاديمية تعليمية أو تدريبية",
        descriptionEn: "Educational or training academy",
        iconName: "School",
        detailFields: ["ownerName"],
      },
      {
        value: "institute",
        labelAr: "معاهد",
        descriptionAr: "معهد تعليمي أو مهني",
        descriptionEn: "Educational or vocational institute",
        iconName: "Building",
        detailFields: ["ownerName"],
      },
      {
        value: "course",
        labelAr: "كورسات",
        descriptionAr: "دورة تدريبية أو كورس محدد",
        descriptionEn: "Training course or specific class",
        iconName: "BookOpen",
        detailFields: ["ownerName"],
      },
      {
        value: "professor",
        labelAr: "أساتذة",
        descriptionAr: "أستاذ جامعي أو مدرس",
        descriptionEn: "University professor or teacher",
        iconName: "UserCheck",
        detailFields: ["ownerName", "reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "university_doctor",
        labelAr: "دكاترة جامعة",
        descriptionAr: "دكتور جامعي أو باحث",
        descriptionEn: "University doctor or researcher",
        iconName: "GraduationCap",
        detailFields: ["ownerName", "reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "kindergarten",
        labelAr: "روضات",
        descriptionAr: "روضة أطفال أو حضانة",
        descriptionEn: "Kindergarten or nursery",
        iconName: "Baby",
        detailFields: ["ownerName"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.reception, COMMON_FLAGS.labour, COMMON_FLAGS.instructor],
  },
  {
    id: "service",
    labelAr: "خدمي",
    labelEn: "Service",
    descAr: "تنظيف، توصيل، تجميل، صرافة، صيانة، صالات أفراح",
    descEn: "Cleaning, delivery, beauty, exchange, repair, wedding halls",
    iconName: "Wrench",
    entityType: "organization",
    subTypes: [
      {
        value: "cleaning_office",
        labelAr: "مكاتب تنظيف",
        descriptionAr: "شركة أو مكتب تنظيف",
        descriptionEn: "Cleaning company or office",
        iconName: "Sparkles",
        detailFields: ["ownerName"],
      },
      {
        value: "delivery_app",
        labelAr: "تطبيقات توصيل",
        descriptionAr: "شركة أو تطبيق توصيل",
        descriptionEn: "Delivery company or app",
        iconName: "Truck",
        detailFields: ["ownerName"],
      },
      {
        value: "beauty_center",
        labelAr: "مراكز تجميل",
        descriptionAr: "مركز تجميل أو عناية",
        descriptionEn: "Beauty or care center",
        iconName: "Scissors",
        detailFields: ["ownerName"],
      },
      {
        value: "massage",
        labelAr: "مساج",
        descriptionAr: "مركز مساج أو سبا",
        descriptionEn: "Massage or spa center",
        iconName: "Hand",
        detailFields: ["ownerName"],
      },
      {
        value: "barber",
        labelAr: "حلاقين",
        descriptionAr: "صالون حلاقة",
        descriptionEn: "Barbershop",
        iconName: "Scissors",
        detailFields: ["ownerName"],
      },
      {
        value: "laundry",
        labelAr: "مغسلة ملابس",
        descriptionAr: "مغسلة ملابس أو تنظيف جاف",
        descriptionEn: "Laundry or dry cleaning",
        iconName: "Shirt",
        detailFields: ["ownerName"],
      },
      {
        value: "club",
        labelAr: "نوادي",
        descriptionAr: "نادي رياضي أو اجتماعي",
        descriptionEn: "Sports or social club",
        iconName: "Users",
        detailFields: ["ownerName"],
      },
      {
        value: "renovation",
        labelAr: "شركات ترميم / مقاولات",
        descriptionAr: "شركة ترميم أو مقاولات",
        descriptionEn: "Renovation or contracting company",
        iconName: "Hammer",
        detailFields: ["ownerName"],
      },
      {
        value: "import_export",
        labelAr: "مكاتب / شركات استيراد شحن تصدير",
        descriptionAr: "شركة استيراد، تصدير أو شحن",
        descriptionEn: "Import, export or shipping company",
        iconName: "Ship",
        detailFields: ["ownerName"],
      },
      {
        value: "exchange",
        labelAr: "صرافة",
        descriptionAr: "محل صرافة أو تحويل أموال",
        descriptionEn: "Exchange or money transfer shop",
        iconName: "Banknote",
        detailFields: ["ownerName"],
      },
      {
        value: "tech_company",
        labelAr: "شركات تقنية / محلات صيانة",
        descriptionAr: "شركة تقنية أو محل صيانة",
        descriptionEn: "Tech company or repair shop",
        iconName: "Cpu",
        detailFields: ["ownerName"],
      },
      {
        value: "wedding_hall",
        labelAr: "صالات أفراح",
        descriptionAr: "صالة أفراح أو مناسبات",
        descriptionEn: "Wedding or event hall",
        iconName: "PartyPopper",
        detailFields: ["ownerName"],
      },
      {
        value: "other",
        labelAr: "غير ذلك",
        descriptionAr: "نوع خدمي آخر غير مدرج",
        descriptionEn: "Other service type not listed",
        iconName: "HelpCircle",
        detailFields: ["ownerName"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.reception, COMMON_FLAGS.labour, COMMON_FLAGS.supportData],
  },
  {
    id: "tourism",
    labelAr: "سياحي",
    labelEn: "Tourism",
    descAr: "فنادق، مطاعم، تكاسي، مكاتب تأجير سيارات، شاليهات",
    descEn: "Hotels, restaurants, taxis, car rentals, chalets",
    iconName: "Plane",
    entityType: "organization",
    subTypes: [
      {
        value: "travel_company",
        labelAr: "شركة سياحة وسفر",
        descriptionAr: "شركة سياحة أو سفر",
        descriptionEn: "Travel or tourism company",
        iconName: "Plane",
        detailFields: ["ownerName"],
      },
      {
        value: "hotel",
        labelAr: "فنادق",
        descriptionAr: "فندق أو نزل",
        descriptionEn: "Hotel or lodging",
        iconName: "Hotel",
        detailFields: ["ownerName"],
      },
      {
        value: "restaurant_cafe",
        labelAr: "مطاعم / مقاهي",
        descriptionAr: "مطعم، مقهى أو كافيتريا",
        descriptionEn: "Restaurant, cafe or cafeteria",
        iconName: "UtensilsCrossed",
        detailFields: ["ownerName"],
      },
      {
        value: "taxi",
        labelAr: "تكاسي",
        descriptionAr: "سيارة أجرة عامة أو تكسي",
        descriptionEn: "Public taxi",
        iconName: "Taxi",
        detailFields: ["carType", "carPlate", "driverPhone", "driverName", "taxiNumber", "appName"],
      },
      {
        value: "car_rental",
        labelAr: "مكاتب تأجير سيارات",
        descriptionAr: "مكتب تأجير سيارات",
        descriptionEn: "Car rental office",
        iconName: "Car",
        detailFields: ["ownerName"],
      },
      {
        value: "farm_chalet",
        labelAr: "مزارع / شاليهات / فلل",
        descriptionAr: "مزرعة، شاليه أو فيلا للإيجار",
        descriptionEn: "Farm, chalet or villa rental",
        iconName: "TreePine",
        detailFields: ["ownerName"],
      },
      {
        value: "private_car",
        labelAr: "سيارة أجرة / خاصة",
        descriptionAr: "سيارة أجرة أو خاصة عبر تطبيق / مكتب",
        descriptionEn: "Taxi or private car via app or office",
        iconName: "Car",
        detailFields: ["carType", "carPlate", "driverPhone", "driverName", "taxiNumber", "appName"],
      },
    ],
    detailFlags: [
      { value: "owner", labelAr: "المالك / بيانات داعمة", iconName: "UserCog" },
      { value: "people", labelAr: "أشخاص", iconName: "Users" },
      { value: "org", labelAr: "جهة", iconName: "Building2" },
    ],
  },
  {
    id: "medical",
    labelAr: "طبي",
    labelEn: "Medical",
    descAr: "صيدليات، عيادات، مستشفيات ومراكز طبية",
    descEn: "Pharmacies, clinics, hospitals and medical centers",
    iconName: "Stethoscope",
    entityType: "organization",
    subTypes: [
      {
        value: "pharmacy",
        labelAr: "صيدلية / صيدليات",
        descriptionAr: "صيدلية أو شركة أدوية",
        descriptionEn: "Pharmacy or drugstore",
        iconName: "Pill",
        detailFields: ["ownerName"],
      },
      {
        value: "personal_clinic",
        labelAr: "عيادة شخصية",
        descriptionAr: "عيادة طبية شخصية",
        descriptionEn: "Personal medical clinic",
        iconName: "Stethoscope",
        detailFields: ["ownerName", "reportedPersonName", "reportedPersonPosition"],
      },
      {
        value: "private_hospital",
        labelAr: "مستشفى خاص",
        descriptionAr: "مستشفى أو مركز طبي خاص",
        descriptionEn: "Private hospital or medical center",
        iconName: "Hospital",
        detailFields: ["ownerName"],
      },
      {
        value: "medical_center",
        labelAr: "مركز طبي / عيادات",
        descriptionAr: "مركز طبي أو مجمع عيادات",
        descriptionEn: "Medical center or clinic complex",
        iconName: "HeartPulse",
        detailFields: ["ownerName"],
      },
    ],
    detailFlags: [COMMON_FLAGS.doctor, COMMON_FLAGS.nurse, COMMON_FLAGS.owner, COMMON_FLAGS.reception, COMMON_FLAGS.labour],
  },
  {
    id: "organizations",
    labelAr: "منظمات",
    labelEn: "Organizations",
    descAr: "منظمات مدنية، إعلام، نقابات، نوادي طلابية",
    descEn: "Civil society, media, unions, student clubs",
    iconName: "Building2",
    entityType: "organization",
    subTypes: [
      {
        value: "civil_society",
        labelAr: "منظمات مجتمع مدني",
        descriptionAr: "منظمة مجتمع مدني",
        descriptionEn: "Civil society organization",
        iconName: "Users",
        detailFields: ["ownerName"],
      },
      {
        value: "social_media_company",
        labelAr: "شركات سوشال ميديا",
        descriptionAr: "شركة منصة تواصل اجتماعي",
        descriptionEn: "Social media platform company",
        iconName: "Globe",
        detailFields: ["ownerName"],
      },
      {
        value: "media_institution",
        labelAr: "مؤسسات أو شركات إعلامية",
        descriptionAr: "مؤسسة إعلامية أو قناة",
        descriptionEn: "Media institution or channel",
        iconName: "Radio",
        detailFields: ["ownerName"],
      },
      {
        value: "quasi_governmental",
        labelAr: "منظمة شبه حكومية",
        descriptionAr: "منظمة شبه حكومية أو عامة",
        descriptionEn: "Quasi-governmental organization",
        iconName: "Building2",
        detailFields: ["ownerName"],
      },
      {
        value: "association",
        labelAr: "جمعيات / نقابات",
        descriptionAr: "جمعية، نقابة أو تجمع مهني",
        descriptionEn: "Association, union or professional gathering",
        iconName: "Handshake",
        detailFields: ["ownerName"],
      },
      {
        value: "student_club",
        labelAr: "تجمعات نوادي طلابية / سكن جامعي",
        descriptionAr: "نادي طلابي أو سكن جامعي",
        descriptionEn: "Student club or university housing",
        iconName: "UsersRound",
        detailFields: ["ownerName", "reportedPersonName", "reportedPersonPosition"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.reception, COMMON_FLAGS.labour, COMMON_FLAGS.clubName, COMMON_FLAGS.investor, COMMON_FLAGS.student],
  },
  {
    id: "real_estate",
    labelAr: "عقاري",
    labelEn: "Real Estate",
    descAr: "منازل، شقق، فلل، مزارع، أراضي، محلات ومكاتب",
    descEn: "Houses, apartments, villas, farms, lands, shops and offices",
    iconName: "Home",
    entityType: "organization",
    subTypes: [
      {
        value: "house",
        labelAr: "منازل",
        descriptionAr: "منزل أو بيت مستقل",
        descriptionEn: "House or standalone home",
        iconName: "Home",
        detailFields: ["ownerName", "propertyType"],
      },
      {
        value: "apartment",
        labelAr: "شقق",
        descriptionAr: "شقة سكنية",
        descriptionEn: "Residential apartment",
        iconName: "Building",
        detailFields: ["ownerName", "propertyType"],
      },
      {
        value: "villa",
        labelAr: "فلل",
        descriptionAr: "فيلا أو منزل كبير",
        descriptionEn: "Villa or large house",
        iconName: "Castle",
        detailFields: ["ownerName", "propertyType"],
      },
      {
        value: "farm",
        labelAr: "مزارع",
        descriptionAr: "مزرعة أو أرض زراعية",
        descriptionEn: "Farm or agricultural land",
        iconName: "Wheat",
        detailFields: ["ownerName", "propertyType"],
      },
      {
        value: "land",
        labelAr: "أراضي",
        descriptionAr: "قطعة أرض",
        descriptionEn: "Land plot",
        iconName: "Map",
        detailFields: ["ownerName", "propertyType"],
      },
      {
        value: "shop",
        labelAr: "محلات",
        descriptionAr: "محل تجاري",
        descriptionEn: "Commercial shop",
        iconName: "Store",
        detailFields: ["ownerName", "propertyType"],
      },
      {
        value: "office",
        labelAr: "مكاتب",
        descriptionAr: "مكتب تجاري",
        descriptionEn: "Commercial office",
        iconName: "Building2",
        detailFields: ["ownerName", "propertyType"],
      },
    ],
    detailFlags: [COMMON_FLAGS.owner, COMMON_FLAGS.supportData],
  },
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

/** Default supporting-document checkbox options for Step 5 (تجربتك). */
export const SUPPORTING_DOCUMENT_OPTIONS: ReadonlyArray<CategoryOption> = [
  { value: "photos", labelAr: "صور", iconName: "Image" },
  { value: "videos", labelAr: "فيديو", iconName: "Video" },
  { value: "audio", labelAr: "تسجيلات صوتية", iconName: "Mic" },
  { value: "documents", labelAr: "وثائق رسمية", iconName: "FileText" },
  { value: "screenshots", labelAr: "لقطات شاشة", iconName: "Monitor" },
  { value: "other", labelAr: "أخرى", iconName: "FileQuestion" },
];
