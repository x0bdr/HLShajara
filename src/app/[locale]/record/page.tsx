import type { Metadata } from "next";
import RecordClient from "./RecordClient";
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
  return getPageMetadata({ locale, namespace: "record", path: "/record" });
}

export default function RecordPage() {
  return (
    <PageShell>
      <RecordClient />
    </PageShell>
  );
}
