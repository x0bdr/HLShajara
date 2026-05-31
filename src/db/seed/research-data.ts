/**
 * Seed script for real research data.
 *
 * Usage:
 *   npx tsx src/db/seed/research-data.ts
 *
 * This script populates the database with documented cases from publicly
 * available international sources. Replace or extend the CASES array below
 * with verified research data before running in production.
 */

import { db } from "../index";
import { entities, allegations, sources, allegationSources } from "../schema";

interface ResearchCase {
  publicId: string;
  type: "individual" | "organization" | "military_unit" | "security_branch" | "official_body";
  name: string;
  nameEn?: string;
  role: string;
  roleEn?: string;
  status: "alleged" | "investigating" | "indicted" | "sanctioned" | "convicted" | "deceased";
  evidenceLevel: "0" | "1" | "2" | "3" | "4";
  isDeceased: boolean;
  allegations: {
    description: string;
    period?: string;
    location?: string;
    classification?: string;
    sources: {
      tier: "A" | "B" | "C";
      title: string;
      titleEn?: string;
      publisher: string;
      date: string;
      url?: string;
      archiveUrl?: string;
    }[];
  }[];
}

/**
 * IMPORTANT: Replace the placeholder cases below with verified research data.
 * The cases below use publicly documented events from international reports
 * (UN CoI Syria, UN-OPCW JIM, Amnesty International, etc.) as structural examples.
 */
const CASES: ResearchCase[] = [
  {
    publicId: "ent-khan-shaykhun-2017",
    type: "military_unit",
    name: "القوات الجوية السورية — شعبة ٦٥٥",
    nameEn: "Syrian Arab Air Force — 655th Squadron",
    role: "وحدة عسكرية تابعة للنظام السابق",
    roleEn: "Military unit of the former regime",
    status: "sanctioned",
    evidenceLevel: "4",
    isDeceased: false,
    allegations: [
      {
        description:
          "مسؤولة عن الهجوم الكيميائي بغاز السارين على خان شيخون في ٤ أبريل ٢٠١٧، resulting in dozens of civilian casualties including children.",
        period: "2017-04-04",
        location: "خان شيخون، إدلب، سوريا",
        classification: "جريمة حرب / أسلحة كيميائية",
        sources: [
          {
            tier: "A",
            title: "تقرير آلية التحقيق المشتركة (UN-OPCW JIM)",
            titleEn: "UN-OPCW Joint Investigative Mechanism Report",
            publisher: "UN-OPCW JIM",
            date: "2017-10-26",
            url: "https://www.un.org/ga/search/view_doc.asp?symbol=S/2017/904",
          },
          {
            tier: "A",
            title: "تقرير لجنة التحقيق الدولية بشأن سوريا",
            titleEn: "UN Commission of Inquiry on Syria Report",
            publisher: "UN Human Rights Council",
            date: "2018-03-06",
            url: "https://www.ohchr.org/en/hr-bodies/hrc/co-isyr/index",
          },
        ],
      },
    ],
  },
  {
    publicId: "ent-branch-251",
    type: "security_branch",
    name: "فرع الأمن العسكري ٢٥١ (الفرع ٢٥١)",
    nameEn: "Military Intelligence Branch 251",
    role: "فرع أمني تابع للاستخبارات العسكرية",
    roleEn: "Security branch of military intelligence",
    status: "convicted",
    evidenceLevel: "4",
    isDeceased: false,
    allegations: [
      {
        description:
          "إدارة مركز اعتقال وتعذيب في دمشق. وثّق تقرير القيصر آلاف الصور لضحايا التعذيب داخل منظومة الفرع ٢٥١.",
        period: "2011–2014",
        location: "دمشق، سوريا",
        classification: "جرائم ضد الإنسانية / تعذيب",
        sources: [
          {
            tier: "A",
            title: "حكم محكمة كوبلنز — قضية الفرع ٢٥١",
            titleEn: "Koblenz Higher Regional Court — Branch 251 Trial",
            publisher: "Oberlandesgericht Koblenz",
            date: "2022-01-13",
            url: "https://www.justiz.nrw.de/Gerichte_Behoerden/olg_koblenz/gericht/internationales_strafrecht/index.php",
          },
          {
            tier: "B",
            title: "تقرير منظمة هيومن رايتس ووتش — قضية القيصر",
            titleEn: "Human Rights Watch — The Caesar Photos Report",
            publisher: "Human Rights Watch",
            date: "2015-12-16",
            url: "https://www.hrw.org/report/2015/12/16/if-dead-could-speak",
          },
        ],
      },
    ],
  },
  {
    publicId: "ent-douma-2018",
    type: "military_unit",
    name: "الفوج ١٩٨ — القوات الجوية",
    nameEn: "198th Regiment — Syrian Air Force",
    role: "وحدة عسكرية",
    roleEn: "Military unit",
    status: "investigating",
    evidenceLevel: "3",
    isDeceased: false,
    allegations: [
      {
        description:
          "مسؤولة عن الهجوم الكيميائي على دوما في ٧ أبريل ٢٠١٨.",
        period: "2018-04-07",
        location: "دوما، الغوطة الشرقية، سوريا",
        classification: "جريمة حرب / أسلحة كيميائية",
        sources: [
          {
            tier: "A",
            title: "تقرير منظمة حظر الأسلحة الكيميائية — فريق التحقيق والتحديد",
            titleEn: "OPCW IIT Report on Douma",
            publisher: "OPCW Investigation and Identification Team",
            date: "2023-01-27",
            url: "https://www.opcw.org/media-centre/news/2023/01/opcw-iit-concludes-chemical-weapons-used-douma-syria-april-2018",
          },
        ],
      },
    ],
  },
];

async function seed() {
  console.log("Seeding research data...");

  for (const c of CASES) {
    // Check if entity already exists
    const existing = await db.query.entities.findFirst({
      where: (e, { eq }) => eq(e.publicId, c.publicId),
    });
    if (existing) {
      console.log(`  SKIP: ${c.publicId} already exists`);
      continue;
    }

    const [entity] = await db
      .insert(entities)
      .values({
        publicId: c.publicId,
        type: c.type,
        name: c.name,
        nameEn: c.nameEn ?? null,
        role: c.role,
        roleEn: c.roleEn ?? null,
        status: c.status,
        evidenceLevel: c.evidenceLevel,
        isDeceased: c.isDeceased,
        version: 1,
        publishedAt: new Date(),
      })
      .returning();

    for (const a of c.allegations) {
      const [allegation] = await db
        .insert(allegations)
        .values({
          entityId: entity.id,
          description: a.description,
          period: a.period ?? null,
          location: a.location ?? null,
          classification: a.classification ?? null,
        })
        .returning();

      for (const s of a.sources) {
        const [source] = await db
          .insert(sources)
          .values({
            tier: s.tier,
            title: s.title,
            titleEn: s.titleEn ?? null,
            publisher: s.publisher,
            date: s.date,
            url: s.url ?? null,
            archiveUrl: s.archiveUrl ?? null,
          })
          .returning();

        await db.insert(allegationSources).values({
          allegationId: allegation.id,
          sourceId: source.id,
        });
      }
    }

    console.log(`  CREATED: ${c.publicId}`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
