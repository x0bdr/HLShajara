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
    // Redirect to login page with return URL
    const { redirect } = await import("next/navigation");
    redirect(`/${locale}/login?redirectTo=/${locale}/reviewer`);
  }

  return <ReviewerClient />;
}
