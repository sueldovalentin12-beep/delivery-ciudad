"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { HeroSlide } from "@/lib/demo-data";

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.min(Math.max(index, 0), slides.length - 1));
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="w-full shrink-0 snap-center px-4"
          >
            <div
              className={`relative flex h-40 items-end overflow-hidden rounded-2xl bg-gradient-to-br ${slide.gradient}`}
            >
              <span
                className="absolute -right-2 -top-3 text-[6.5rem] opacity-90"
                aria-hidden
              >
                {slide.emoji}
              </span>
              <div className="relative z-10 p-4">
                <p className="text-[17px] font-bold leading-tight text-white drop-shadow">
                  {slide.title}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-white/90">
                  {slide.subtitle}
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {slides.map((slide, index) => (
          <span
            key={slide.id}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-4 bg-brand" : "w-1.5 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
