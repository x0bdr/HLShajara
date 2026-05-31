"use client";

import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface PageShellProps {
  children: ReactNode;
  narrow?: boolean;
  noPad?: boolean;
}

export function PageShell({ children, narrow = false, noPad = false }: PageShellProps) {
  const widthClass = narrow ? "page-container-narrow" : "page-container";
  const padClass = noPad ? "" : "page-pad";
  return (
    <>
      <Header />
      <main className={`page-main ${widthClass} ${padClass}`}>{children}</main>
      <Footer />
    </>
  );
}
