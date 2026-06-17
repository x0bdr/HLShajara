export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { PageShell, HeroSection, PrinciplesSection } from "@/components";
import { PhotoGridSection } from "@/components/PhotoGridSection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <PageShell noPad>
      <HeroSection />
      <PrinciplesSection />
      <PhotoGridSection locale={locale} />
    </PageShell>
  );
}
