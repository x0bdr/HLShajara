"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const locale = useLocale();
  const footer = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <span className="site-footer-name">
              {locale === "ar" ? "لست شجرة" : "LST Shajara"}
            </span>
            <p className="site-footer-desc">
              {locale === "ar"
                ? "منصّة مدنية لتوثيق الجرائم في سوريا وحفظ السجلّ الموثَّق للمساءلة."
                : "A civic platform documenting crimes in Syria and preserving an accountability record."}
            </p>
          </div>
          <div className="site-footer-links">
            <div className="site-footer-col">
              <span className="site-footer-col-title">{nav("record")}</span>
              <Link href={`/${locale}/record`}>{nav("record")}</Link>
              <Link href={`/${locale}/dashboard`}>{nav("dashboard")}</Link>
            </div>
            <div className="site-footer-col">
              <span className="site-footer-col-title">{nav("mission")}</span>
              <Link href={`/${locale}/mission`}>{nav("mission")}</Link>
              <Link href={`/${locale}/faq`}>{nav("faq")}</Link>
              <Link href={`/${locale}/policy`}>{nav("policy")}</Link>
            </div>
            <div className="site-footer-col">
              <span className="site-footer-col-title">{nav("reply")}</span>
              <Link href={`/${locale}/reply`}>{nav("reply")}</Link>
              <Link href={`/${locale}/submit`}>{nav("submit")}</Link>
            </div>
          </div>
        </div>
        <div className="site-footer-bottom">
          <p className="ds-meta">{footer("copyright")}</p>
          <div className="site-footer-legal">
            <Link href={`/${locale}/terms`} className="ds-meta">
              {footer("terms")}
            </Link>
            <span className="ds-meta" style={{ color: "var(--fg3)" }}>·</span>
            <Link href={`/${locale}/privacy`} className="ds-meta">
              {footer("privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
