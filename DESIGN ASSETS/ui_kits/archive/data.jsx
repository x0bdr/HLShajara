/* Bilingual strings + sample archive records (placeholders — legal gate not yet passed) */

const STRINGS = {
  en: {
    dir: "ltr", lang: "en",
    brandName: "HLShajara", brandSub: "Documentation & accountability archive",
    navArchive: "Archive", navConsole: "Reviewer console", langBtn: "العربية",
    legalT: "Legal note",
    legal: "This content expresses a political opinion within the scope of freedom of expression under the interim Constitutional Declaration. It is not legal advice.",
    homeTitle: "An archive of record",
    homeLead: "We collect, verify, and publish publicly available evidence about specific named individuals and entities credibly implicated in crimes in Syria — never communities, sects, or groups. No source, no publication.",
    search: "Search by name, conduct, or role…",
    byConduct: "By conduct", byRole: "By role", byStrength: "By evidence strength",
    noIdentity: "Filtering by sect, religion, ethnicity, family, region or tribe is unavailable by design — there is no such field in the data model.",
    resultsCount: (n) => `${n} entries`,
    sources: "Sources", reply: "Right of reply", replyNone: "contact recorded · no statement filed",
    replyFiled: "statement on file", audited: "audited",
    back: "Back to archive", allegations: "Allegations", auditTrail: "Audit trail",
    addReply: "Submit right of reply", openConsole: "Open in console",
    conduct: "Conduct", role: "Role", period: "Period", location: "Location", classification: "Legal classification",
    consoleTitle: "Reviewer console", consoleSub: "Two independent reviewers must agree before anything is published.",
    queue: "Review queue", pipeline: "Verification pipeline",
    stages: ["Intake","Triage","Sources","Dual review","Legal gate","Publish"],
    reviewer1: "Reviewer 1", reviewer2: "Reviewer 2", legalGate: "Legal / safety gate",
    approve: "Approve", escalate: "Escalate", reject: "Reject", pending: "pending", done: "approved",
    rejectionRules: "Rejection rules", selectEntry: "Select an entry from the queue",
    creed: ["Evidence over allegation","Conduct, not identity","No source, no publication","Right of reply","Privacy of the innocent","No vigilantism"],
    footerNote: "Documentation, lawful accountability — not revenge, not collective punishment.",
  },
  ar: {
    dir: "rtl", lang: "ar",
    brandName: "حملة لستَ شجرة", brandSub: "أرشيف التوثيق والمساءلة",
    navArchive: "الأرشيف", navConsole: "لوحة المراجعة", langBtn: "English",
    legalT: "ملاحظة قانونية",
    legal: "يعبّر هذا المحتوى عن رأي سياسي ويقع ضمن نطاق حرية التعبير وفقاً للإعلان الدستوري المؤقت. ولا يشكّل استشارة قانونية.",
    homeTitle: "سجلٌّ موثَّق",
    homeLead: "نجمع ونتحقّق وننشر الأدلّة المتاحة علنًا حول أفرادٍ وجهاتٍ محدّدين مُسمّين تتوفّر أدلّة موثوقة على تورّطهم في جرائم في سوريا — لا حول طوائف أو مكوّنات أو جماعات. لا مصدر، لا نشر.",
    search: "ابحث بالاسم أو السلوك أو الدور…",
    byConduct: "حسب السلوك", byRole: "حسب الدور", byStrength: "حسب قوة الأدلة",
    noIdentity: "الفلترة حسب الطائفة أو الدين أو العرق أو العائلة أو المنطقة غير متاحة بالتصميم — لا وجود لهذا الحقل في نموذج البيانات.",
    resultsCount: (n) => `${n} سجلّات`,
    sources: "المصادر", reply: "حق الرد", replyNone: "جهة الاتصال مسجّلة · لم يُقدَّم بيان",
    replyFiled: "يوجد بيان", audited: "مُدقّق",
    back: "العودة إلى الأرشيف", allegations: "الادّعاءات", auditTrail: "سجلّ التدقيق",
    addReply: "تقديم حق الرد", openConsole: "فتح في اللوحة",
    conduct: "السلوك", role: "الدور", period: "الفترة", location: "المكان", classification: "التصنيف القانوني",
    consoleTitle: "لوحة المراجعة", consoleSub: "يجب أن يتّفق مراجعان مستقلّان قبل أي نشر.",
    queue: "قائمة المراجعة", pipeline: "مسار التحقّق",
    stages: ["الاستلام","الفرز","المصادر","المراجعة المزدوجة","البوابة القانونية","النشر"],
    reviewer1: "المراجع الأول", reviewer2: "المراجع الثاني", legalGate: "البوابة القانونية / السلامة",
    approve: "اعتماد", escalate: "تصعيد", reject: "رفض", pending: "قيد الانتظار", done: "مُعتمد",
    rejectionRules: "قواعد الرفض", selectEntry: "اختر سجلًّا من القائمة",
    creed: ["الدليل لا الادّعاء","سلوك لا هوية","لا مصدر، لا نشر","حق الرد","خصوصية الأبرياء","لا تصفٍّ ذاتي"],
    footerNote: "توثيق ومساءلة قانونية — لا انتقام ولا عقاب جماعي.",
  }
};

// Evidence-strength labels per language (index maps to ev levels 0..4)
const EV_LABELS = {
  en: ["Under review","Single credible source","Multi-source corroborated","UN / IIIM-documented","Court-confirmed"],
  ar: ["قيد المراجعة","مصدر موثوق واحد","مؤكَّد بمصادر متعددة","موثّق أمميًّا","مؤكَّد قضائيًّا"],
};
const STATUS_LABELS = {
  en: {alleged:"Alleged", investigating:"Under investigation", indicted:"Indicted", sanctioned:"Sanctioned", convicted:"Convicted", deceased:"Deceased"},
  ar: {alleged:"مُدَّعى", investigating:"قيد التحقيق", indicted:"مُتَّهم", sanctioned:"خاضع لعقوبات", convicted:"مُدان", deceased:"متوفّى"},
};
const STATUS_VAR = {alleged:"--st-alleged", investigating:"--st-investigating", indicted:"--st-indicted",
  sanctioned:"--st-sanctioned", convicted:"--st-convicted", deceased:"--st-deceased"};

// Sample entities — names withheld behind the legal gate, by design.
const ENTITIES = [
  {
    id:"ENT-2024-0117", type:{en:"individual",ar:"فرد"}, ev:4, status:"convicted", version:3, reply:"none",
    name:{en:"[Named Official]", ar:"[مسؤول مُسمّى]"},
    role:{en:"Commanding role · detention facility", ar:"دور قيادي · مرفق احتجاز"},
    conductTags:["command","detention","torture"], roleTag:"official_body",
    allegations:[{
      desc:{en:"Command responsibility over unlawful detention and torture at a named facility.",
            ar:"مسؤولية القيادة عن احتجاز غير قانوني وتعذيب في مرفق محدّد بالاسم."},
      period:{en:"2012–2014",ar:"٢٠١٢–٢٠١٤"}, location:{en:"Damascus",ar:"دمشق"},
      classification:{en:"Crimes against humanity (alleged framework)",ar:"جرائم ضد الإنسانية (إطار مُدَّعى)"},
      sources:[
        {tier:"A", title:{en:"National court judgment, case no. […]",ar:"حكم محكمة وطنية، القضية رقم […]"}, pub:{en:"Court record",ar:"سجلّ المحكمة"}, date:"2022"},
        {tier:"A", title:{en:"UN Commission of Inquiry report",ar:"تقرير لجنة التحقيق الأممية"}, pub:{en:"UN HRC",ar:"مجلس حقوق الإنسان"}, date:"2021", ref:"A/HRC/…"},
      ],
    }],
  },
  {
    id:"ENT-2024-0203", type:{en:"security branch",ar:"فرع أمني"}, ev:3, status:"sanctioned", version:2, reply:"none",
    name:{en:"[Named Security Branch]", ar:"[فرع أمني مُسمّى]"},
    role:{en:"Detention & interrogation unit", ar:"وحدة احتجاز واستجواب"},
    conductTags:["detention","disappearance"], roleTag:"security_branch",
    allegations:[{
      desc:{en:"Enforced disappearance and systematic mistreatment of detainees, documented across multiple UN reports.",
            ar:"إخفاء قسري وسوء معاملة منهجي للمحتجزين، موثّق عبر تقارير أممية متعددة."},
      period:{en:"2011–2018",ar:"٢٠١١–٢٠١٨"}, location:{en:"Multiple",ar:"مواقع متعددة"},
      classification:{en:"Enforced disappearance",ar:"الإخفاء القسري"},
      sources:[
        {tier:"A", title:{en:"EU sanctions listing",ar:"قائمة العقوبات الأوروبية"}, pub:{en:"Council of the EU",ar:"مجلس الاتحاد الأوروبي"}, date:"2020"},
        {tier:"B", title:{en:"HR organization report w/ methodology",ar:"تقرير منظمة حقوقية بمنهجية موثّقة"}, pub:{en:"Recognized NGO",ar:"منظمة معتمدة"}, date:"2019"},
      ],
    }],
  },
  {
    id:"ENT-2024-0288", type:{en:"military unit",ar:"وحدة عسكرية"}, ev:2, status:"indicted", version:1, reply:"filed",
    name:{en:"[Named Military Unit]", ar:"[وحدة عسكرية مُسمّاة]"},
    role:{en:"Field operations command", ar:"قيادة عمليات ميدانية"},
    conductTags:["command","attack"], roleTag:"military_unit",
    allegations:[{
      desc:{en:"Alleged involvement in unlawful attacks on protected sites; corroborated by investigative reporting.",
            ar:"تورّط مُدَّعى في هجمات غير قانونية على مواقع محمية؛ مؤكَّد بتحقيقات صحفية."},
      period:{en:"2015–2016",ar:"٢٠١٥–٢٠١٦"}, location:{en:"Northern Syria",ar:"شمال سوريا"},
      classification:{en:"War crimes (alleged)",ar:"جرائم حرب (مُدَّعاة)"},
      sources:[
        {tier:"B", title:{en:"Prosecutorial filing",ar:"مذكّرة ادّعاء"}, pub:{en:"National prosecutor",ar:"النيابة الوطنية"}, date:"2023"},
        {tier:"C", title:{en:"Investigative report (corroborating)",ar:"تقرير استقصائي (داعم)"}, pub:{en:"Established outlet",ar:"وسيلة معتمدة"}, date:"2022"},
      ],
    }],
  },
  {
    id:"ENT-2024-0341", type:{en:"individual",ar:"فرد"}, ev:1, status:"investigating", version:1, reply:"none",
    name:{en:"[Named Official]", ar:"[مسؤول مُسمّى]"},
    role:{en:"Administrative oversight role", ar:"دور إشرافي إداري"},
    conductTags:["detention"], roleTag:"official_body",
    allegations:[{
      desc:{en:"Single credible source links the individual to oversight of a detention site; under verification.",
            ar:"مصدر موثوق واحد يربط الشخص بالإشراف على موقع احتجاز؛ قيد التحقّق."},
      period:{en:"2013",ar:"٢٠١٣"}, location:{en:"Homs",ar:"حمص"},
      classification:{en:"Under assessment",ar:"قيد التقييم"},
      sources:[
        {tier:"B", title:{en:"Legal filing (single source)",ar:"مذكّرة قانونية (مصدر واحد)"}, pub:{en:"Court",ar:"محكمة"}, date:"2024"},
      ],
    }],
  },
];

// Filter taxonomies — conduct / role / strength only (never identity)
const CONDUCT = {en:["Command responsibility","Unlawful detention","Torture","Enforced disappearance","Unlawful attack"],
                ar:["مسؤولية قيادية","احتجاز غير قانوني","تعذيب","إخفاء قسري","هجوم غير قانوني"]};
const ROLES = {en:["Security branch","Military unit","Official body","Individual"],
               ar:["فرع أمني","وحدة عسكرية","جهة رسمية","فرد"]};

const REJECTION_RULES = {
  en:[["GROUP_TARGET","References a community / sect / ethnicity / family / region"],
      ["NO_SOURCE","Lacks any accepted source"],["WEAK_SOURCE","Only Tier-C / rumor for a serious claim"],
      ["PRIVATE_TARGETING","Exposes home address / live location"],["INNOCENT_PARTY","Names children or uninvolved persons"],
      ["MISMATCH","Source does not support the specific claim"],["HATE_TONE","Dehumanizing or sectarian language"]],
  ar:[["GROUP_TARGET","يشير إلى مجتمع / طائفة / عرق / عائلة / منطقة"],
      ["NO_SOURCE","يفتقر إلى أي مصدر مقبول"],["WEAK_SOURCE","مصدر من الفئة C / إشاعة لادّعاء خطير"],
      ["PRIVATE_TARGETING","يكشف عنوان السكن / الموقع الحي"],["INNOCENT_PARTY","يسمّي أطفالًا أو أشخاصًا غير معنيين"],
      ["MISMATCH","المصدر لا يدعم الادّعاء المحدّد"],["HATE_TONE","لغة تجريديّة أو طائفية"]],
};

Object.assign(window, { STRINGS, EV_LABELS, STATUS_LABELS, STATUS_VAR, ENTITIES, CONDUCT, ROLES, REJECTION_RULES });
