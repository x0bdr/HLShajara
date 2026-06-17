"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

const HANDLE = "HLShajara";

const SOCIAL_LINKS = [
  { name: "X / Twitter", href: `https://x.com/${HANDLE}` },
  { name: "Instagram", href: `https://instagram.com/${HANDLE}` },
  { name: "Facebook", href: `https://facebook.com/${HANDLE}` },
  { name: "YouTube", href: `https://youtube.com/@${HANDLE}` },
  { name: "TikTok", href: `https://tiktok.com/@${HANDLE}` },
  { name: "Telegram", href: `https://t.me/${HANDLE}` },
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
          <div className="site-footer-social-buttons">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="site-footer-social-btn"
              >
                {link.name}
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
