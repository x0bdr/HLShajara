<div align="center">

# 🌿 لست شجرة — HLShajara

**توثيق ومساءلة — لا انتقام ولا عقاب جماعي**

*Documentation and lawful accountability — not revenge, not collective punishment*

[العربية](#العربية) · [English](#english)

---

</div>

## العربية

«**لست شجرة**» منصّة مدنية للتوثيق والمساءلة، تحفظ السجلّ الموثّق للجرائم التي ارتُكبت في سوريا. نجمع ونتحقّق وننشر الأدلّة المتاحة علنًا حول **أفرادٍ وجهاتٍ محدّدين** تتوفّر أدلّة موثوقة على تورّطهم — لا حول طوائف أو مكوّنات أو جماعات.

### غايتنا
- حفظ الذاكرة
- دعم الضحايا
- دعم المساءلة عبر القنوات القانونية وحقوق الإنسان المشروعة

### القيمة الأساسية
كل ادّعاء منشور يخصّ **شخصًا أو جهةً مُسمّاة** ومدعومٌ بـ**مصدر عام موثوق**. لا مصدر، لا نشر. لا جماعة، لا استهداف هوويّ.

### ما نفعله
- أرشيف عام مُوثَّق بالمصادر عن أفرادٍ وجهاتٍ مُتّهمة موثوقًا في سوريا.
- مسار إحالة نحو آليات العدالة القانونية: المحاكم، هيئات الأمم المتحدة (لجنة التحقيق / IIIM)، والدعوة إلى العقوبات.
- فضاء للذاكرة ودعم الضحايا.

### ما لا نفعله
- ليس حملة مقاطعة أو ضغط اجتماعي.
- ليس أداة لتعبئة الجمهور ضد أحد.
- لا نتهم مجتمعات أو طوائف أو عائلات أو مناطق أو قبائل.
- لا نسمح بالتحرّش أو التهديدات أو الكشف عن العناوين (doxxing) أو الانتقام.

### مبادئ العمل
- **الدليل لا الادّعاء** — لا ادّعاء بلا مصدر عام قابل للتحقق.
- **أفراد وجهات فقط** — لا مجتمع، لا طائفة، لا عرق، لا عائلة، لا منطقة، لا قبيلة.
- **سلوك لا هوية** — نوثّق ما يُنسب موثوقًا إلى فعل معيّن، بالمصادر.
- **لا تحريض** — لا دعوات للمقاطعة أو العزل أو التهديد أو الأذى أو الانتقام.
- **تعبير دقيق** — نستخدم "مُتهم" / "مُتّهم موثوقًا" / "قيد التحقيق" / "مدان" بحسب ما تدعم الأدلة.
- **حق الرد والتصحيح** — الأطراف المُسمّاة يحقّ لها الرد، والتصحيحات تُكرّم فورًا.
- **خصوصية الأبرياء** — أفراد الأسرة والأطفال والمرتبطون غير المعنيين لا يُنشرون كأهداف.
- **لا تصفٍّ ذاتي** — ندعم القنوات القانونية فقط؛ لا ننشر عناوين سكن أو ما يُمكّن الاستهداف الجسدي.

### مراحل التطوير
المشروع مقسّم على 8 مراحل، من لبّ النزاهة (نموذج بيانات خالٍ من الهوية، مدقّق تحقق موحّد، سجلّ تدقيق غير قابل للحذف) إلى الإطلاق العام المراقب.

انظر: [`ROADMAP.md`](.planning/ROADMAP.md)

### المستندات الرئيسية
| الملف | المحتوى |
|-------|---------|
| [`CONCEPT.md`](CONCEPT.md) | مفهوم الحملة بالعربية والإنجليزية |
| [`content/project.json`](content/project.json) | تعريف المشروع والمهمة واللغات |
| [`content/principles.json`](content/principles.json) | القواعد غير القابلة للتفاوض ومدونة السلوك |
| [`content/data-model.json`](content/data-model.json) | نموذج البيانات والقيود الصلبة |
| [`content/sources.json`](content/sources.json) | درجات المصادر وقوة الأدلة |
| [`content/workflow.json`](content/workflow.json) | مسار التحقق وقواعد الرفض |
| [`content/roles.json`](content/roles.json) | الأدوار والصلاحيات |
| [`content/roadmap.json`](content/roadmap.json) | نطاق MVP والمراحل |
| [`.planning/PROJECT.md`](.planning/PROJECT.md) | وثيقة المشروع الرئيسية |
| [`.planning/REQUIREMENTS.md`](.planning/REQUIREMENTS.md) | المتطلبات التفصيلية (24 متطلبًا) |
| [`.planning/ROADMAP.md`](.planning/ROADMAP.md) | خارطة الطريق المفصّلة (8 مراحل) |
| [`.planning/STATE.md`](.planning/STATE.md) | حالة المشروع الحالية |

### التقنية (المخطّط لها)
- **Next.js 16** + **TypeScript** — إطار الويب ثنائي اللغة (عربي RTL / إنجليزي LTR)
- **PostgreSQL** — قاعدة البيانات العلائقية مع قيود صلبة على مستوى الـschema
- **Drizzle ORM** — ORM مكتوب بالـTypeScript مع migrations قابلة للمراجعة
- **OpenSearch** — بحث نصي كامل مع دعم قوي للعربية
- **Better Auth** — مصادقة ذاتية مع 2FA إلزامي للفريق
- **Zod** — تحقق runtime لكل الإدخالات

التفاصيل الكاملة: [`CLAUDE.md`](CLAUDE.md)

### البوابة القانونية
لا يُنشر اسم أي إنسان حيّ علنًا قبل أن يراجع محامٍ مؤهّل في الاختصاص القضائي للتشغيل معيار النشر والمدخلات الأولى. هذا قيد تشهير + حماية بيانات لا يمكن تجاوزه.

### الترخيص
هذا المشروع مرخص بموجب [MIT License](LICENSE).

---

## English

"**HLShajara**" («لست شجرة») is a civic **documentation and accountability** platform that preserves the documented record of crimes committed in Syria. We collect, verify, and publish publicly available evidence about **specific individuals and entities** credibly implicated — never communities, sects, or groups.

### Purpose
- Preserve memory
- Support victims
- Support accountability through legitimate legal and human-rights channels

### Core Value
Every published claim concerns a **named individual or entity** and is backed by a **credible public source**. No source, no publication. No group, no identity-based targeting.

### What We Are
- A source-backed public archive of individuals and entities credibly implicated in crimes in Syria.
- A referral pathway to lawful justice mechanisms: courts, UN bodies (CoI/IIIM), and sanctions advocacy.
- A space for memory and victim support.

### What We Are Not
- Not a boycott or social-pressure campaign.
- Not a tool to mobilize the public against anyone.
- Not an accuser of communities, sects, families, regions, or tribes.
- Not a venue for harassment, threats, doxxing, or revenge.

### Principles
- **Evidence over allegation** — no claim without a verifiable public source.
- **Individuals and entities only** — never a community, sect, ethnicity, family, region, or tribe.
- **Conduct, not identity** — document what someone is credibly alleged to have done, with sources.
- **No incitement** — no calls to boycott, isolate, harass, threaten, harm, or take revenge.
- **Accurate framing** — use alleged / credibly implicated / under investigation / convicted exactly as the evidence supports.
- **Right of reply and correction** — named parties may respond; corrections are honored promptly.
- **Privacy of the innocent** — family members, children, and uninvolved associates are never published as targets.
- **No vigilantism** — support lawful channels only; never publish home addresses or anything enabling physical targeting.

### Development Phases
The project is organized into 8 phases, from the Integrity Core (identity-free data model, single validation choke point, append-only hash-chained audit log) to a monitored public launch.

See: [`ROADMAP.md`](.planning/ROADMAP.md)

### Key Documents
| File | Content |
|------|---------|
| [`CONCEPT.md`](CONCEPT.md) | Campaign concept (AR/EN) |
| [`content/project.json`](content/project.json) | Project definition, mission, languages |
| [`content/principles.json`](content/principles.json) | Non-negotiable boundaries & code of conduct |
| [`content/data-model.json`](content/data-model.json) | Data model & hard constraints |
| [`content/sources.json`](content/sources.json) | Source tiers & evidence strength |
| [`content/workflow.json`](content/workflow.json) | Verification pipeline & rejection rules |
| [`content/roles.json`](content/roles.json) | Roles & permissions |
| [`content/roadmap.json`](content/roadmap.json) | MVP scope & phases |
| [`.planning/PROJECT.md`](.planning/PROJECT.md) | Master project document |
| [`.planning/REQUIREMENTS.md`](.planning/REQUIREMENTS.md) | Detailed requirements (24 reqs) |
| [`.planning/ROADMAP.md`](.planning/ROADMAP.md) | Detailed roadmap (8 phases) |
| [`.planning/STATE.md`](.planning/STATE.md) | Current project state |

### Technology (Planned)
- **Next.js 16** + **TypeScript** — Bilingual web framework (AR RTL / EN LTR)
- **PostgreSQL** — Relational database with hard schema-level constraints
- **Drizzle ORM** — TypeScript-first ORM with reviewable migrations
- **OpenSearch** — Full-text search with production-grade Arabic support
- **Better Auth** — Self-hosted auth with mandatory 2FA for staff
- **Zod** — Runtime validation for every input

Full details: [`CLAUDE.md`](CLAUDE.md)

### Legal Gate
No living individual is named publicly until a qualified lawyer in the operating jurisdiction reviews the publication standard and the first entries. This is a defamation + data-protection boundary that cannot be bypassed.

### License
This project is licensed under the [MIT License](LICENSE).
