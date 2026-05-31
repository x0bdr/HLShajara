import { setRequestLocale } from "next-intl/server";
import LoginClient from "./LoginClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LoginClient />;
}
