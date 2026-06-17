import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import WizardClient from "./WizardClient";
import { PageShell } from "@/components";
import { getPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getPageMetadata({ locale, namespace: "submit", path: "/submit" });
}

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submit" });

  return (
    <PageShell narrow>
      <div className="page-header-center">
        <h1 className="ds-h1">{t("title")}</h1>
        <p className="ds-lead">{t("lead")}</p>
      </div>

      {/* WizardClient reads ?step= via useSearchParams, which requires a Suspense
          boundary under static prerendering (generateStaticParams). */}
      <Suspense fallback={null}>
        <WizardClient />
      </Suspense>
    </PageShell>
  );
}
