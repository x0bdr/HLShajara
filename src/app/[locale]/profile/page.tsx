import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PageShell } from "@/components";
import ProfileClient from "./ProfileClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login?redirectTo=/${locale}/profile`);
  }

  return (
    <PageShell narrow>
      <div className="ds-h1" style={{ marginBottom: 24 }}>
        {locale === "ar" ? "الملف الشخصي" : "Profile"}
      </div>
      <ProfileClient
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
      />
    </PageShell>
  );
}
