import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const STATIC_PATHS = [
  "",
  "/mission",
  "/faq",
  "/record",
  "/submit",
  "/reply",
  "/terms",
  "/privacy",
  "/policy",
  "/publications",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [];

  for (const locale of ["ar", "en"]) {
    for (const path of STATIC_PATHS) {
      const url =
        path === ""
          ? `${SITE_URL}/${locale}`
          : `${SITE_URL}/${locale}${path}`;
      staticEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  const publishedPosts = db.select
    ? await db
        .select({
          slug: posts.slug,
          locale: posts.locale,
          publishedAt: posts.publishedAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(and(eq(posts.status, "published"), isNotNull(posts.publishedAt)))
    : [];

  const postEntries: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${SITE_URL}/${post.locale}/publications/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
