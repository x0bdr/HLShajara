export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

import { PageShell, HeroSection, PrinciplesSection, SocialFeedSection } from "@/components";

export default async function HomePage() {
  return (
    <PageShell noPad>
      <HeroSection />
      <PrinciplesSection />
      <SocialFeedSection />
    </PageShell>
  );
}
