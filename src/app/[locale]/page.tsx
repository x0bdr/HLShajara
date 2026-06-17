import type { Metadata } from "next";
import { PageShell, HeroSection, PrinciplesSection } from "@/components";
import { SliderSection } from "@/components/SliderSection";
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
  return getPageMetadata({ locale, namespace: "home", path: "" });
}

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
