import { LegalNote } from "@/components";

export default function PrivacyPage() {
  const lang = "ar" as const;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
      <div className="ds-h1" style={{ marginBottom: 16 }}>سياسة الخصوصية</div>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>١. البيانات التي نجمعها</div>
        <p className="ds-body-sm">
          عند تقديم بلاغ، نجمع: اسم الجهة المُبلَّغ عنها، وصف الادّعاء، والمصادر،
          وبريدك الإلكتروني (اختياري إذا اخترت عدم الإفصاح). لا نجمع
          عناوين IP كاملة — فقط تجزئة SHA-256 لمنع الاستغلال.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>٢. كيف نستخدم البيانات</div>
        <p className="ds-body-sm">
          نستخدم البيانات للتحقق والمراجعة فقط. لا نبيع أو نشارك بيانات
          المُبلِّغين مع أي طرف ثالث. البيانات المُقدَّمة بشكل مجهول
          لا يمكن ربطها بأي هوية.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>٣. ملفات التعريف (Cookies)</div>
        <p className="ds-body-sm">
          نستخدم ملفات تعريف ضرورية فقط لإدارة الجلسات. لا نستخدم أدوات
          تتبع طرف ثالث.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="ds-h3" style={{ marginBottom: 8 }}>٤. حقوقك</div>
        <p className="ds-body-sm">
          يحقّلك طلب حذف بياناتك الشخصية في أي وقت عبر التواصل معنا.
          لكننا لا نحذف السجلات المتعلقة بالمراجعة والتدقيق لأنها
          جزء من سجلّ المساءلة.
        </p>
      </section>

      <LegalNote lang={lang}>
        بناءً على الإعلان الدستوري السوري (١٣ مارس ٢٠٢٥)، المادة ١٣ تكفل حرية التعبير.
        هذا المحتوى يعبّر عن رأي سياسي.
      </LegalNote>
    </main>
  );
}
