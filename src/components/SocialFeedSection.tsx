"use client";

import { useLocale, useTranslations } from "next-intl";

const HANDLE = "HLShajara";

export function SocialFeedSection() {
  const locale = useLocale();
  const t = useTranslations("home");

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>
        <a
          className="twitter-timeline"
          data-height="600"
          data-tweet-limit="10"
          href={`https://twitter.com/${HANDLE}?ref_src=twsrc%5Etfw`}
        >
          {locale === "ar" ? `تغريدات @${HANDLE}` : `Tweets by @${HANDLE}`}
        </a>
        <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8" />
      </div>
    </section>
  );
}
