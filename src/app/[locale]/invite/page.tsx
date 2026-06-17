import { setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components";
import InviteClient from "./InviteClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  return (
    <PageShell narrow>
      <InviteClient token={token || ""} />
    </PageShell>
  );
}
