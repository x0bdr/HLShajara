import { LegalNote } from "@/components";

export default function MissionPage() {
  const lang = "ar" as const;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 16 }}>المهمّة والمبادئ</div>

      <section style={{ marginBottom: 32 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>ما نفعله</div>
        <p className="ds-body">
          لست شجرة منصّة توثيق مدنية تسعى لحفظ سجلّ عام موثَّق بالمصادر حول الجرائم
          التي ارتُكبت في سوريا. نركّز على أفراد وجهات محدّدين مرتبطين بأفعال
          محدّدة، ونحيل هذه السجلات إلى آليات العدالة القانونية.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>ما لا نفعله</div>
        <ul style={{ paddingInlineStart: 20, color: "var(--fg1)", lineHeight: 1.7 }}>
          <li>لا نستهدف جماعات أو طوائف أو هويات.</li>
          <li>لا ننشر أي ادّعاء بدون مصدر موثَّق.</li>
          <li>لا ننشر عناوين منازل أو بيانات تحديد موقع.</li>
          <li>لا نسمح بأي محتوى تحريضي أو خطاب كراهية.</li>
          <li>لا ننشر أسماء أطفال أو أشخاص غير متورّطين.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>مدونة السلوك</div>
        <p className="ds-body">
          كل مساهم في المشروع ملزم بالالتزام بمعايير التوثيق القانونية،
          وعدم الكشف عن معلومات خاصة، وعدم الانحياز الطائفي أو العرقي.
          المراجعة المزدوجة إلزامية قبل أي نشر.
        </p>
      </section>

      <LegalNote lang={lang}>
        بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
        هذا المحتوى يعبّر عن رأي سياسي.
      </LegalNote>
    </main>
  );
}
