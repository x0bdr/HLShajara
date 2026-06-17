export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { PageShell, HeroSection, PrinciplesSection, SliderSection } from "@/components";

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
      <SliderSection locale={locale} />
    </PageShell>
  );
}
