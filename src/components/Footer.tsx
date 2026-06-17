"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

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
    name: "Instagram",
    href: `https://instagram.com/${HANDLE}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: `https://facebook.com/${HANDLE}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
    name: "TikTok",
    href: `https://tiktok.com/@${HANDLE}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52V6.69h-1.04z" />
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
    ? "شعبية سليمة | اجتماعية اقتصادية"
    : "Peaceful Popular | Social & Economic";
  const foundedLabel = locale === "ar" ? "التأسيس" : "Founded";
  const foundedDay = locale === "ar" ? "30 مايو" : "30 May";
  const emailLabel = locale === "ar" ? "البريد الإلكتروني" : "Email";

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
