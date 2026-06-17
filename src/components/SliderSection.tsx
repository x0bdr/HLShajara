import { getTranslations } from "next-intl/server";
import { ImageSlider } from "./ImageSlider";
import slides from "../../content/slider-images.json";

export async function SliderSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="social-feed-section">
      <div className="social-feed-inner">
        <h2 className="social-feed-title">{t("socialFeedTitle")}</h2>
        <ImageSlider slides={slides} />
      </div>
    </section>
  );
}
