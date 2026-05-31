import { LegalNote } from "@/components";

export default function TermsPage() {
  const lang = "ar" as const;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 16 }}>شروط الاستخدام</div>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>١. طبيعة المحتوى</div>
        <p className="ds-body-sm">
          هذا الموقع يعبّر عن رأي سياسي ويوثّق ادّعاءات مرتبطة بأفراد وجهات محدّدة
          في سياق النزاع السوري. المحتوى يستند إلى مصادر علنية وقابلة للتحقق.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>٢. الاستخدام المسموح</div>
        <p className="ds-body-sm">
          يُسمح باستخدام المحتوى للأغراض البحثية والإعلامية والقانونية، بشرط
          الإشارة إلى المصدر الأصلي. لا يجوز استخدام المحتوى لأغراض تحريضية
          أو ملاحقة أشخاص.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>٣. إخلاء المسؤولية</div>
        <p className="ds-body-sm">
          نبذل قصارى جهدنا لضمان دقة المعلومات، لكننا لا نضمن اكتمالها أو
          خلوّها من أخطاء. المستخدم مسؤول عن التحقق المستقل.
        </p>
      </section>

      <LegalNote lang={lang}>
        بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
        هذا المحتوى يعبّر عن رأي سياسي.
      </LegalNote>
    </main>
  );
}
