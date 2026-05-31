import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVars } from "./fonts";
import "@/styles/tokens.css";
import "@/components/hlshajara.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "لست شجرة — HLShajara",
  description:
    "منصة مدنية للتوثيق والمساءلة والمقاطعة، تحفظ السجلّ الموثّق للجرائم التي ارتُكبت في سوريا.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={fontVars}>
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
