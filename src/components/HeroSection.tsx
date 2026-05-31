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
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-seal">
            <Image
              src="/logo.jpeg"
              alt="لست شجرة"
              width={120}
              height={120}
              className="hero-seal-img"
              priority
            />
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
            <Link href={`/${locale}/record`}>
              <Button variant="secondary">{nav("record")}</Button>
            </Link>
          </div>
        </div>
        <div className="hero-ornament" aria-hidden="true">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-tree">
            {/* Tree trunk */}
            <path d="M200 380 L200 280" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            {/* Branches */}
            <path d="M200 280 Q160 240 140 200" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M200 280 Q240 240 260 200" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M200 310 Q170 270 150 230" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M200 310 Q230 270 250 230" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M200 250 Q180 210 170 170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M200 250 Q220 210 230 170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Leaves */}
            <ellipse cx="140" cy="190" rx="22" ry="14" fill="currentColor" opacity="0.35" />
            <ellipse cx="260" cy="190" rx="22" ry="14" fill="currentColor" opacity="0.35" />
            <ellipse cx="170" cy="160" rx="18" ry="12" fill="currentColor" opacity="0.3" />
            <ellipse cx="230" cy="160" rx="18" ry="12" fill="currentColor" opacity="0.3" />
            <ellipse cx="200" cy="140" rx="28" ry="16" fill="currentColor" opacity="0.4" />
            <ellipse cx="155" cy="215" rx="16" ry="10" fill="currentColor" opacity="0.25" />
            <ellipse cx="245" cy="215" rx="16" ry="10" fill="currentColor" opacity="0.25" />
            {/* Roots */}
            <path d="M200 380 Q170 400 140 395" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M200 380 Q230 400 260 395" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M200 390 Q185 405 170 402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M200 390 Q215 405 230 402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M200 395 Q190 408 180 406" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            <path d="M200 395 Q210 408 220 406" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          </svg>
        </div>
      </div>
      <div className="hero-divider" aria-hidden="true" />
    </section>
  );
}
