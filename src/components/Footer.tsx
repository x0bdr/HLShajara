"use client";

import Image from "next/image";
import { useLocale } from "next-intl";

const CREED_AR = ["الدليل لا الادّعاء", "سلوك لا هوية", "لا مصدر، لا نشر", "حق الرد", "خصوصية الأبرياء", "لا تصفٍّ ذاتي"];
const CREED_EN = ["Evidence over allegation", "Conduct, not identity", "No source, no publication", "Right of reply", "Privacy of the innocent", "No vigilantism"];

export function Footer() {
  const locale = useLocale();
  const creed = locale === "ar" ? CREED_AR : CREED_EN;
  const brandName = locale === "ar" ? "حملة لستَ شجرة" : "HLShajara";
  const footerNote = locale === "ar"
    ? "توثيق ومساءلة قانونية — لا انتقام ولا عقاب جماعي."
    : "Documentation, lawful accountability — not revenge, not collective punishment.";

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
        <div className="site-footer-creed">
          {creed.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
