import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { hasRole } from "@/lib/auth";
import ReviewerClient from "./ReviewerClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function ReviewerPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const isAuthorized = session && hasRole(session.user.role ?? "", "reviewer");

  if (!isAuthorized) {
    return (
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px", textAlign: "center" }}>
        <div className="ds-h1" style={{ marginBottom: 16 }}>
          {locale === "ar" ? "غير مصرّح" : "Unauthorized"}
        </div>
        <p className="ds-body" style={{ color: "var(--fg2)" }}>
          {locale === "ar"
            ? "يتطلّب الوصول إلى لوحة المراجعة حساب مراجع مسجّل الدخول."
            : "Reviewer console access requires an authenticated reviewer account."}
        </p>
      </main>
    );
  }

  return <ReviewerClient />;
}
