import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

const PHOTO_DIR = join(process.cwd(), "public", "pics", "new");
const PUBLIC_PREFIX = "/pics/new/";

async function getPhotos(): Promise<string[]> {
  try {
    const files = await readdir(PHOTO_DIR);
    return files
      .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort()
      .map((f) => `${PUBLIC_PREFIX}${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export async function PhotoGridSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const photos = await getPhotos();

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>

        {photos.length > 0 ? (
          <>
            <div className="photo-grid">
              {photos.map((src, i) => (
                <div key={i} className="photo-grid-item">
                  <Image
                    src={src}
                    alt={`صورة ${i + 1}`}
                    fill
                    className="photo-grid-img"
                    unoptimized
                    sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
            <div className="photo-grid-more">
              <a
                href="https://x.com/HLShajara"
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary"
              >
                {t("viewMore")}
              </a>
            </div>
          </>
        ) : (
          <p className="photo-grid-empty">{t("noPhotos")}</p>
        )}
      </div>
    </section>
  );
}
