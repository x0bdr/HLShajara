const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL);

async function seed() {
  await sql`
    INSERT INTO posts (slug, locale, status, title, excerpt, body, published_at)
    VALUES 
      ('founding-statement', 'ar', 'published', 
       'بيان تأسيس الحملة', 
       'تأسست حملة "لستَ شجرة" في 30 مايو 2026 كمنصّة مدنية لتوثيق الجرائم المرتكبة في سوريا.',
       '<p>تأسست حملة <strong>"لستَ شجرة"</strong> في <strong>30 مايو 2026</strong> كمنصّة مدنية لتوثيق الجرائم المرتكبة في سوريا ضد أفرادٍ وجهاتٍ محدّدين.</p><p>هدفنا بناء سجلّ موثَّق ومصدر-backed يُحال إلى آليات العدالة القانونية الدولية.</p><h2>مبادئنا</h2><ul><li>لا عنف، لا تهجير، لا انتقام</li><li>الدليل لا الادّعاء</li><li>سلوك لا هوية</li><li>حق الرد مكفول</li><li>لا مسامحة فوق حق الضحايا</li></ul>',
       NOW()),
      ('founding-statement', 'en', 'published',
       'Campaign Founding Statement',
       'HLShajara was founded on May 30, 2026 as a civic platform documenting crimes committed in Syria.',
       '<p><strong>HLShajara</strong> was founded on <strong>May 30, 2026</strong> as a civic platform documenting crimes committed in Syria against named individuals and entities.</p><p>Our goal is to build a documented, source-backed record channeled toward international lawful justice mechanisms.</p><h2>Our Principles</h2><ul><li>No violence, no displacement, no revenge</li><li>Evidence over allegation</li><li>Conduct, not identity</li><li>Right of reply guaranteed</li><li>No reconciliation above victims'' rights</li></ul>',
       NOW())
    ON CONFLICT (slug, locale) DO NOTHING
  `;
  console.log("Seed posts inserted.");
  await sql.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
