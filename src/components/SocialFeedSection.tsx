import { getTranslations } from "next-intl/server";

const HANDLE = "HLShajara";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: { like_count?: number; retweet_count?: number };
}

async function fetchTweets(): Promise<Tweet[] | null> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return null;

  try {
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${HANDLE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!userRes.ok) return null;
    const userData = (await userRes.json()) as { data?: { id: string } };
    const userId = userData.data?.id;
    if (!userId) return null;

    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&exclude=replies,retweets&tweet.fields=created_at,public_metrics`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    );
    if (!tweetsRes.ok) return null;
    const tweetsData = (await tweetsRes.json()) as { data?: Tweet[] };
    return tweetsData.data ?? null;
  } catch {
    return null;
  }
}

export async function SocialFeedSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tweets = await fetchTweets();

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>

        {tweets && tweets.length > 0 ? (
          <div className="tweets-list">
            {tweets.map((tweet) => (
              <a
                key={tweet.id}
                href={`https://x.com/${HANDLE}/status/${tweet.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tweet-card"
              >
                <div className="tweet-meta">
                  <span className="tweet-handle">@{HANDLE}</span>
                  <span className="tweet-date">
                    {new Date(tweet.created_at).toLocaleDateString(locale === "ar" ? "ar-SY" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="tweet-text">{tweet.text}</p>
                {(tweet.public_metrics?.like_count || tweet.public_metrics?.retweet_count) ? (
                  <div className="tweet-metrics">
                    {tweet.public_metrics.like_count !== undefined && (
                      <span>❤ {tweet.public_metrics.like_count}</span>
                    )}
                    {tweet.public_metrics.retweet_count !== undefined && (
                      <span>↻ {tweet.public_metrics.retweet_count}</span>
                    )}
                  </div>
                ) : null}
              </a>
            ))}
          </div>
        ) : (
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
            <script
              async
              src="https://platform.twitter.com/widgets.js"
              charSet="utf-8"
            />
          </div>
        )}
      </div>
    </section>
  );
}
