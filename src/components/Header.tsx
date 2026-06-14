"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { pushDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function Header() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = "main-nav";

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    pushDataLayer(GTM_EVENTS.PAGE_VIEW, { locale: newLocale, action: "locale_switch" });
    router.push(newPath);
  };

  const isActive = (path: string) => pathname === `/${locale}${path}`;

  const navLinks = [
    { href: "/record", label: t("record") },
    { href: "/publications", label: t("publications") },
    { href: "/mission", label: t("mission") },
    { href: "/faq", label: t("faq") },
    { href: "/reply", label: t("reply") },
    { href: "/dashboard", label: t("dashboard") },
    { href: "/policy", label: t("policy") },
  ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href={`/${locale}`} className="site-brand">
          <div className="site-logo-wrap">
            <Image
              src="/logo.jpeg"
              alt="حملة لستَ شجرة"
              width={42}
              height={42}
              className="site-logo"
              priority
            />
          </div>
          <div className="site-brand-text">
            <span className="site-brand-name">{locale === "ar" ? "حملة لستَ شجرة" : "HLShajara"}</span>
            <span className="site-brand-tag">
              {locale === "ar" ? "منصّة توثيق ومساءلة" : "Civic Documentation"}
            </span>
          </div>
        </Link>

        <nav id={menuId} className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className={`site-nav-link${isActive(link.href) ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <button
            type="button"
            className="site-menu-btn"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
          <Link href={`/${locale}/submit`} className="btn primary btn-sm">
            {t("submit")}
          </Link>
          <button
            onClick={switchLocale}
            className="site-lang-btn"
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            {locale === "ar" ? "EN" : "عربي"}
          </button>
        </div>
      </div>
    </header>
  );
}
