"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";

interface Slide {
  src: string;
  alt: string;
}

interface ImageSliderLabels {
  prev: string;
  next: string;
  dotLabels: string[];
  pause: string;
  play: string;
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function ImageSlider({
  slides,
  labels,
}: {
  slides: Slide[];
  labels: ImageSliderLabels;
}) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const reducedMotion = useReducedMotion();

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (!isPlaying || reducedMotion) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length, isPlaying, reducedMotion]);

  const handlePrev = () => {
    prev();
    setIsPlaying(false);
  };

  const handleNext = () => {
    next();
    setIsPlaying(false);
  };

  const handleDot = (i: number) => {
    goTo(i);
    setIsPlaying(false);
  };

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
              loading="eager"
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
            onClick={handlePrev}
            aria-label={labels.prev}
          >
            ‹
          </button>
          <button
            type="button"
            className="image-slider-btn next"
            onClick={handleNext}
            aria-label={labels.next}
          >
            ›
          </button>

          <button
            type="button"
            className="image-slider-pause"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? labels.pause : labels.play}
            aria-pressed={!isPlaying}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <div className="image-slider-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? "active" : ""}
                onClick={() => handleDot(i)}
                aria-label={labels.dotLabels[i]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
