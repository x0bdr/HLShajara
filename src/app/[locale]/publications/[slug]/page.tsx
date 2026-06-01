import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export const dynamic = "force-dynamic";

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

  return (
    <PageShell>
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
