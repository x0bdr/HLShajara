import { Suspense } from "react";
import WizardClient from "./WizardClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function SubmitPage() {
  return (
    <PageShell narrow>
      {/* WizardClient reads ?step= via useSearchParams, which requires a Suspense
          boundary under static prerendering (generateStaticParams). */}
      <Suspense fallback={null}>
        <WizardClient />
      </Suspense>
    </PageShell>
  );
}
