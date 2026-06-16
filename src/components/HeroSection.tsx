"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "./Button";

export function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const nav = useTranslations("nav");

  return (
    <section className="hero hero-dramatic">
      <div className="hero-inner">
        <div className="hero-seal">
          <Image
            src="/logo.jpeg"
            alt="حملة لستَ شجرة"
            width={160}
            height={160}
            className="hero-seal-img"
            priority
          />
        </div>
        <div className="hero-badge">
          {locale === "ar" ? "تأسست 30 مايو 2026" : "Founded May 30, 2026"}
        </div>
        <h1 className="hero-title">
          {t("title")}
        </h1>
        <p className="hero-subtitle">
          {t("subtitle")}
        </p>
        <p className="hero-lead">
          {t("lead")}
        </p>
        <div className="hero-actions">
          <Link href={`/${locale}/submit`}>
            <Button variant="primary">{nav("submit")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
