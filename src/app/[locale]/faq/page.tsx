import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell, LegalNote } from "@/components";
import { getPageMetadata } from "@/lib/seo";
import { jsonLdSafe } from "@/lib/escape";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getPageMetadata({ locale, namespace: "faq", path: "/faq" });
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  // H1: escape `</script>` (and U+2028/U+2029) before embedding the JSON-LD inline.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdSafe(data) }}
    />
  );
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "faq" });
  const legal = await getTranslations({ locale, namespace: "legal" });

  const faqs = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
  ].filter((faq) => faq.a && faq.a.trim().length > 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <PageShell narrow>
      <JsonLd data={faqSchema} />
      <div className="page-header-center">
        <h1 className="ds-h1">{t("title")}</h1>
      </div>

      <div className="flex-col gap-16">
        {faqs.map((faq, i) => (
          <div key={i} className="card card-pad-md">
            <div className="ds-h3 mb-8">{faq.q}</div>
            <p className="ds-body-sm text-fg2">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-24">
        <LegalNote lang={locale as "ar" | "en"}>{legal("note")}</LegalNote>
      </div>
    </PageShell>
  );
}
