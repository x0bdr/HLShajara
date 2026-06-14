import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell } from "@/components";
import StatsAdminClient from "./StatsAdminClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function StatsAdminPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const isAdmin = session && hasRole(session.user.role ?? "", "admin");

  if (!isAdmin) {
    redirect(`/${locale}/login?redirectTo=/${locale}/admin/stats`);
  }

  return (
    <PageShell>
      <div className="ds-h1" style={{ marginBottom: 24 }}>
        {locale === "ar" ? "إحصائيات المستخدمين" : "User Statistics"}
      </div>
      <StatsAdminClient />
    </PageShell>
  );
}
