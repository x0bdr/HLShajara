"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { assetPath } from "@/lib/asset-path";

export function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const nav = useTranslations("nav");

  return (
    <section className="hero hero-dramatic">
      <div className="hero-inner">
        <div className="hero-seal">
          <Image
            src={assetPath("/logo.jpeg")}
            alt="حملة لستَ شجرة"
            width={160}
            height={160}
            className="hero-seal-img"
            priority
          />
        </div>
        <h1 className="hero-title">
          {t("title")}
        </h1>
        <p className="hero-subtitle">
          <span>{t("subtitleLine1")}</span>
          <span>{t("subtitleLine2")}</span>
          <span>{t("subtitleLine3")}</span>
        </p>
        <p className="hero-lead">
          {t("lead")}
        </p>
        <div className="hero-actions">
          <Link href={`/${locale}/submit`} className="btn primary">
            {nav("submit")}
          </Link>
        </div>
      </div>
    </section>
  );
}
