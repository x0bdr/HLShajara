import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepliesAdminClient from "./RepliesAdminClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function RepliesAdminPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const isAuthorized = session && hasRole(session.user.role ?? "", "admin");

  if (!isAuthorized) {
    redirect(`/${locale}/login?redirectTo=/${locale}/admin/replies`);
  }

  return <RepliesAdminClient />;
}
