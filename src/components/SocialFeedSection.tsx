import { getTranslations } from "next-intl/server";

const RSS_URL = "https://rss.xcancel.com/search/rss?f=tweets&q=hlshajara";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchRssFeed(): Promise<RssItem[] | null> {
  try {
    const res = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HLShajaraBot/1.0)",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const xml = await res.text();

    const items: RssItem[] = [];
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    for (const block of itemBlocks) {
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
      const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      const title = titleMatch ? stripTags(titleMatch[1]) : "";
      const link = linkMatch ? stripTags(linkMatch[1]) : "";
      const pubDate = dateMatch ? stripTags(dateMatch[1]) : "";

      // Skip the placeholder / whitelist warning item.
      if (title.toLowerCase().includes("not yet whitelisted")) continue;
      if (title && link) {
        items.push({ title, link, pubDate });
      }
    }

    return items.length > 0 ? items.slice(0, 10) : null;
  } catch {
    return null;
  }
}

export async function SocialFeedSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const items = await fetchRssFeed();

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>

        {items ? (
          <div className="tweets-list">
            {items.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="tweet-card"
              >
                <div className="tweet-meta">
                  <span className="tweet-handle">@HLShajara</span>
                  <span className="tweet-date">
                    {item.pubDate
                      ? new Date(item.pubDate).toLocaleDateString(
                          locale === "ar" ? "ar-SY" : "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : ""}
                  </span>
                </div>
                <p className="tweet-text">{item.title}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="twitter-feed-wrap">
            <a
              className="twitter-timeline"
              data-height="600"
              data-tweet-limit="10"
              href="https://x.com/HLShajara"
            >
              {locale === "ar" ? "تغريدات @HLShajara" : "Tweets by @HLShajara"}
            </a>
            <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8" />
          </div>
        )}
      </div>
    </section>
  );
}
