import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageShell } from "@/components";
import Link from "next/link";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function AuthErrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { locale } = await params;
  const { error, message } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("login");

  const errorMap: Record<string, string> = {
    OAuthCallback: locale === "ar" ? "فشلت عملية المصادقة الاجتماعية." : "Social authentication failed.",
    OAuthAccountNotLinked: locale === "ar" ? "هذا الحساب مرتبط بمستخدم آخر." : "This account is linked to another user.",
    default: locale === "ar" ? "حدث خطأ أثناء تسجيل الدخول." : "An error occurred during sign in.",
  };

  const displayError = errorMap[error || ""] || errorMap.default;

  return (
    <PageShell narrow>
      <div className="login-card" style={{ textAlign: "center" }}>
        <div className="ds-h1" style={{ marginBottom: 16 }}>
          {locale === "ar" ? "خطأ في المصادقة" : "Authentication Error"}
        </div>
        <p className="ds-body" style={{ color: "var(--brick-600)", marginBottom: 24 }}>
          {message || displayError}
        </p>
        <Link href={`/${locale}/login`} className="btn primary">
          {t("title")}
        </Link>
      </div>
    </PageShell>
  );
}
