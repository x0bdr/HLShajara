"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

export function Footer() {
  const locale = useLocale();
  const brandName = locale === "ar" ? "حملة لستَ شجرة" : "HLShajara";
  const footerNote = locale === "ar"
    ? "شعبية سليمة | اجتماعية اقتصادية"
    : "Peaceful Popular | Social & Economic";
  const foundedLabel = locale === "ar" ? "التأسيس" : "Founded";
  const foundedDay = locale === "ar" ? "30 مايو" : "30 May";

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Image
            src="/logo.jpeg"
            alt=""
            width={36}
            height={36}
            className="site-footer-logo"
          />
          <div>
            <div className="site-footer-name">{brandName}</div>
            <div className="site-footer-note">{footerNote}</div>
          </div>
        </div>

        <div className="site-footer-founded">
          <div className="site-footer-founded-year">2026</div>
          <div className="site-footer-founded-label">{foundedLabel}</div>
          <div className="site-footer-founded-day">{foundedDay}</div>
        </div>

        <div className="site-footer-social">
          <a
            href="https://x.com/HLShajara"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-social-link"
          >
            X / Twitter: @HLShajara
          </a>
          <a
            href="mailto:info@hlshajara.com"
            className="site-footer-social-link"
          >
            {locale === "ar" ? "البريد الإلكتروني" : "Email"}: info@hlshajara.com
          </a>
        </div>
      </div>
    </footer>
  );
}
