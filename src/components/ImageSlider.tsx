"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Slide {
  src: string;
  alt: string;
}

export function ImageSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (!slides.length) return null;

  return (
    <div className="image-slider">
      <div
        className="image-slider-track"
        style={{ transform: `translateX(${index * -100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="image-slider-slide">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="image-slider-img"
              unoptimized
              sizes="(max-width: 720px) 100vw, 680px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="image-slider-btn prev"
            onClick={prev}
            aria-label="الصورة السابقة"
          >
            ‹
          </button>
          <button
            type="button"
            className="image-slider-btn next"
            onClick={next}
            aria-label="الصورة التالية"
          >
            ›
          </button>

          <div className="image-slider-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
                aria-label={`الصورة ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
