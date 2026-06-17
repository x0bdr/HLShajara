"use client";

import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";

export function SocialFeedSection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const handle = "HLShajara";
  const profileUrl = `https://twitter.com/${handle}`;

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
            href={profileUrl}
          >
            {locale === "ar" ? `تغريدات @${handle}` : `Tweets by @${handle}`}
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
