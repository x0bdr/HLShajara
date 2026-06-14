import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { fontVars } from "../fonts";
import { GtmScript, GtmNoScript } from "@/components/GtmScript";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/components/hlshajara.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={dir} className={fontVars}>
      <head>
        <GtmScript />
      </head>
      <body
        style={{
          margin: 0,
          background: "var(--bg)",
          color: "var(--fg1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <GtmNoScript />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
