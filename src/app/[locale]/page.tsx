export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { PageShell, HeroSection, PrinciplesSection, SocialFeedSection } from "@/components";

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
      <SocialFeedSection locale={locale} />
    </PageShell>
  );
}
