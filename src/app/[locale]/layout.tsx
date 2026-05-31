import type { ReactNode } from "react";
import { fontVars } from "../fonts";
import "@/styles/tokens.css";
import "@/components/hlshajara.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={fontVars}>
      <body
        style={{
          margin: 0,
          background: "var(--bg)",
          color: "var(--fg1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
