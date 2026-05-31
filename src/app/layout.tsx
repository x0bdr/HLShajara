import type { ReactNode } from "react";
import { fontVars } from "./fonts";
import "@/styles/tokens.css";
import "@/components/hlshajara.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
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
