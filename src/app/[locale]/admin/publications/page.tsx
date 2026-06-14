import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import PublicationsAdminClient from "./PublicationsAdminClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function PublicationsAdminPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const isAuthorized = session && hasRole(session.user.role ?? "", "reviewer");

  if (!isAuthorized) {
    redirect(`/${locale}/login?redirectTo=/${locale}/admin/publications`);
  }

  return (
    <PageShell>
      <div className="ds-h1" style={{ marginBottom: 24 }}>
        {locale === "ar" ? "إدارة المنشورات" : "Publication Management"}
      </div>
      <PublicationsAdminClient />
    </PageShell>
  );
}
