import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("publications");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: {
      languages: {
        ar: "/ar/publications",
        en: "/en/publications",
      },
    },
  };
}

export const dynamic = "force-dynamic";

async function getPublishedPosts(locale: string) {
  return db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.locale, locale),
        eq(posts.status, "published"),
        isNotNull(posts.publishedAt)
      )
    )
    .orderBy(desc(posts.publishedAt));
}

export default async function PublicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("publications");
  const nav = await getTranslations("nav");
  const publishedPosts = await getPublishedPosts(locale);

  return (
    <PageShell>
      <div className="pubs-header">
        <h1 className="pubs-title">{t("title")}</h1>
        <p className="pubs-lead">{t("lead")}</p>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="pubs-empty">
          <p>{t("empty")}</p>
          <Link href={`/${locale}`} className="pubs-empty-link">
            {nav("home")}
          </Link>
        </div>
      ) : (
        <div className="pubs-grid">
          {publishedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/${locale}/publications/${post.slug}`}
              className="pub-card"
            >
              {post.coverImageUrl && (
                <div className="pub-card-image-wrap">
                  <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    className="pub-card-image"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              <div className="pub-card-body">
                <h2 className="pub-card-title">{post.title}</h2>
                {post.excerpt && (
                  <p className="pub-card-excerpt">{post.excerpt}</p>
                )}
                {post.publishedAt && (
                  <time className="pub-card-date">
                    {new Date(post.publishedAt).toLocaleDateString(
                      locale === "ar" ? "ar-SY" : "en-GB",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </time>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
