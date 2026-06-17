"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { assetPath } from "@/lib/asset-path";

const HANDLE = "HLShajara";

const SOCIAL_LINKS = [
  {
    name: "X / Twitter",
    href: `https://x.com/${HANDLE}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: `https://youtube.com/@${HANDLE}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: `https://t.me/${HANDLE}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0011.944 0zm5.508 7.556c-.162.018-3.252.677-6.526 1.469-3.274.792-5.995 1.461-6.052 1.487-.162.061-.356.25-.356.424 0 .143.076.275.221.375.107.074 2.035 1.38 4.284 2.903l4.075 2.789.087.061c.17.119.283.186.393.186.143 0 .221-.09.25-.164.018-.048 1.65-4.323 3.692-9.745.167-.46.314-.865.327-.9.039-.11.021-.212-.055-.286-.09-.088-.236-.113-.35-.099zM7.95 13.04l.001 3.2 1.061-2.359 2.96 2.03-3.021-2.871z" />
      </svg>
    ),
  },
];

export function Footer() {
  const locale = useLocale();
  const brandName = locale === "ar" ? "حملة لستَ شجرة" : "HLShajara";
  const footerNote = locale === "ar"
    ? "شعبية سلمية | اجتماعية اقتصادية"
    : "Peaceful Popular | Social & Economic";
  const foundedLabel = locale === "ar" ? "التأسيس" : "Founded";
  const foundedDay = locale === "ar" ? "30 مايو" : "30 May";
  const emailLabel = locale === "ar" ? "البريد الإلكتروني" : "Email";

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Image
            src={assetPath("/logo.jpeg")}
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
          <div className="site-footer-social-icons">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className="site-footer-social-icon"
              >
                {link.icon}
              </a>
            ))}
          </div>
          <a
            href="mailto:info@hlshajara.com"
            className="site-footer-social-link"
          >
            {emailLabel}: info@hlshajara.com
          </a>
        </div>
      </div>
    </footer>
  );
}
