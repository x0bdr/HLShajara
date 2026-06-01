"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const isActive = (path: string) => pathname === `/${locale}${path}`;

  const navLinks = [
    { href: "/record", label: t("record") },
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
              width={44}
              height={44}
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

        <nav className="site-nav" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className={`site-nav-link${isActive(link.href) ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
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
