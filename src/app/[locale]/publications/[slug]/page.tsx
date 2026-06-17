import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageShell } from "@/components";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicationTracker } from "@/components/PublicationTracker";
import { SITE_URL, brandName } from "@/lib/seo";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const row = await db
    .select({ title: posts.title, excerpt: posts.excerpt })
    .from(posts)
    .where(
      and(
        eq(posts.slug, slug),
        eq(posts.locale, locale),
        eq(posts.status, "published"),
        isNotNull(posts.publishedAt)
      )
    )
    .limit(1);

  const post = row[0];
  if (!post) {
    return { title: "Not Found" };
  }

  const pageUrl = `${SITE_URL}/${locale}/publications/${slug}`;

  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: {
      canonical: `/${locale}/publications/${slug}`,
      languages: {
        ar: `/ar/publications/${slug}`,
        en: `/en/publications/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      url: pageUrl,
      siteName: brandName(locale),
      images: [{ url: "/logo.jpeg", width: 640, height: 640, alt: post.title }],
      locale,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
      images: ["/logo.jpeg"],
    },
  };
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

async function getPost(locale: string, slug: string) {
  const rows = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.slug, slug),
        eq(posts.locale, locale),
        eq(posts.status, "published"),
        isNotNull(posts.publishedAt)
      )
    )
    .limit(1);
  return rows[0] || null;
}

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("publications");
  const post = await getPost(locale, slug);

  if (!post) notFound();

  const pageUrl = `${SITE_URL}/${locale}/publications/${slug}`;
  const orgName = brandName(locale);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImageUrl ? [post.coverImageUrl] : [`${SITE_URL}/logo.jpeg`],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author: {
      "@type": "Organization",
      name: orgName,
    },
    publisher: {
      "@type": "Organization",
      name: orgName,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.jpeg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  return (
    <PageShell>
      <PublicationTracker slug={slug} locale={locale} />
      <JsonLd data={articleSchema} />
      <article className="pub-article">
        <Link href={`/${locale}/publications`} className="pub-back">
          ← {t("back")}
        </Link>

        {post.coverImageUrl && (
          <div className="pub-hero-image-wrap">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="pub-hero-image"
              priority
              sizes="100vw"
            />
          </div>
        )}

        <header className="pub-header">
          <h1 className="pub-article-title">{post.title}</h1>
          {post.publishedAt && (
            <time className="pub-article-date">
              {new Date(post.publishedAt).toLocaleDateString(
                locale === "ar" ? "ar-SY" : "en-GB",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </time>
          )}
        </header>

        <div
          className="pub-body"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>
    </PageShell>
  );
}
