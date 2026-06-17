"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useStore } from "better-auth/react";
import { pushDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function Header() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = "main-nav";

  const { data: session } = useStore(authClient.useSession);
  const role = ((session?.user as { role?: string } | null)?.role) ?? null;
  const isAdmin = role === "admin";
  const isStaff = ["reviewer", "senior_reviewer", "admin"].includes(role ?? "");
  const isSignedIn = Boolean(session?.user);

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    pushDataLayer(GTM_EVENTS.PAGE_VIEW, { locale: newLocale, action: "locale_switch" });
    router.push(newPath);
  };

  const isActive = (path: string) => pathname === `/${locale}${path}`;

  const handleLogout = async () => {
    await authClient.signOut();
    router.push(`/${locale}`);
  };

  const navLinks = [
    ...(isAdmin
      ? [
          { href: "/reviewer", label: t("reviewer") },
          { href: "/admin/publications", label: t("adminPublications") },
          { href: "/admin/replies", label: t("adminReplies") },
          { href: "/admin/stats", label: t("adminStats") },
        ]
      : isStaff
        ? [{ href: "/reviewer", label: t("reviewer") }]
        : []),
    ...(isSignedIn ? [{ href: "/profile", label: t("profile") }] : []),
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
              {locale === "ar" ? "شعبية سلمية | اجتماعية اقتصادية" : "Peaceful Popular | Social & Economic"}
            </span>
          </div>
        </Link>

        <nav id={menuId} className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={`/${locale}${link.href}`}
              className={`site-nav-link${isActive(link.href) ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/submit`}
            className={`site-nav-cta${isActive("/submit") ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {t("submit")}
          </Link>
        </nav>

        <div className="site-actions">
          <Link
            href={`/${locale}/submit`}
            className={`site-nav-cta site-nav-cta--desktop${isActive("/submit") ? " active" : ""}`}
          >
            {t("submit")}
          </Link>
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
          <button
            onClick={switchLocale}
            className="site-lang-btn"
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            {locale === "ar" ? "EN" : "عربي"}
          </button>
          {isSignedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="site-logout-btn"
              aria-label={t("logout")}
            >
              {t("logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
