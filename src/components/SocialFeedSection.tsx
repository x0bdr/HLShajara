"use client";

import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";

const HANDLE = "HLShajara";

export function SocialFeedSection() {
  const locale = useLocale();
  const t = useTranslations("home");

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>
        <div className="twitter-feed-wrap">
          <a
            className="twitter-timeline"
            data-height="600"
            data-tweet-limit="10"
            data-chrome="noheader nofooter transparent"
            href={`https://twitter.com/${HANDLE}`}
          >
            {locale === "ar" ? `تغريدات @${HANDLE}` : `Tweets by @${HANDLE}`}
          </a>
        </div>
      </div>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== "undefined") {
            const twttr = (window as unknown as { twttr?: { widgets?: { load: () => void } } }).twttr;
            twttr?.widgets?.load();
          }
        }}
      />
    </section>
  );
}
