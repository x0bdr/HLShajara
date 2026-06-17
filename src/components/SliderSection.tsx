import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { assetPath } from "@/lib/asset-path";
import { ImageSlider } from "./ImageSlider";

const PHOTO_DIR = join(process.cwd(), "public", "pics", "new");
const PUBLIC_PREFIX = assetPath("/pics/new/");

async function getPhotoFiles(): Promise<string[]> {
  try {
    const files = await readdir(PHOTO_DIR);
    return files
      .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

export async function SliderSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const files = await getPhotoFiles();
  const slides = files.map((f, i) => ({
    src: `${PUBLIC_PREFIX}${encodeURIComponent(f)}`,
    alt: t("slideAlt", { n: i + 1 }),
  }));

  const labels = {
    prev: t("sliderPrev"),
    next: t("sliderNext"),
    dotLabels: files.map((_, i) => t("sliderDot", { n: i + 1 })),
    pause: t("sliderPause"),
    play: t("sliderPlay"),
  };

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>

        {slides.length > 0 ? (
          <>
            <ImageSlider slides={slides} labels={labels} />
            <div className="slider-more">
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
          <p className="slider-empty">{t("noPhotos")}</p>
        )}
      </div>
    </section>
  );
}
