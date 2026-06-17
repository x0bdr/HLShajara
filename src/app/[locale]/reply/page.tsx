import type { Metadata } from "next";
import ReplyClient from "./ReplyClient";
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
  return getPageMetadata({ locale, namespace: "reply", path: "/reply" });
}

export default function ReplyPage() {
  return (
    <PageShell narrow>
      <ReplyClient />
    </PageShell>
  );
}
