"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MotoIcon } from "@/components/moto-icon";
import { Photo } from "@/components/photo";
import type { HeroSlide } from "@/lib/demo-data";

/** Cada cuánto pasa solo a la siguiente imagen. */
const AUTO_MS = 5000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  /** La persona tiene el dedo encima (o se frenó hace poco): no avanzamos. */
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    const next = Math.min(Math.max(index, 0), slides.length - 1);
    activeRef.current = next;
    setActive(next);
  }

  function pause() {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }

  function resumeSoon() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, 4000);
  }

  // Avanza solo cada ~5 s; se frena al tocar, con la pestaña oculta o si la
  // persona pidió menos movimiento.
  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track || pausedRef.current || document.visibilityState !== "visible") {
        return;
      }
      const next = (activeRef.current + 1) % slides.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, AUTO_MS);
    return () => {
      clearInterval(timer);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [slides.length]);

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onTouchStart={pause}
        onTouchEnd={resumeSoon}
        onTouchCancel={resumeSoon}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") pause();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") resumeSoon();
        }}
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
              {slide.photo ? (
                <>
                  <Photo
                    src={slide.photo}
                    emoji={slide.emoji}
                    gradient={slide.gradient}
                    sizes="(max-width: 448px) 100vw, 416px"
                    emojiClassName="text-[6.5rem]"
                  />
                  {/* Degradé para que el texto blanco se lea sobre cualquier foto. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
                </>
              ) : (
                <>
                  {/* La portada del envío: nuestra moto sobre una ruta, con la caja
                      en blanco para que no se pierda en el verde. */}
                  <span
                    className="absolute right-3 top-4 flex flex-col items-center"
                    style={
                      {
                        "--brand": "#ffffff",
                        "--brand-dark": "#14532d",
                      } as React.CSSProperties
                    }
                    aria-hidden
                  >
                    <MotoIcon className="relative z-10 h-[4.75rem] w-auto" moving />
                    <span className="-mt-3 h-4 w-36 rounded-full bg-black/15" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </>
              )}
              <div className="relative z-10 p-4">
                <p className="text-[17px] font-bold leading-tight text-white drop-shadow">
                  {slide.title}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-white/90 drop-shadow-sm">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
        {slides.map((slide, index) => (
          <span
            key={slide.id}
            className={`h-1.5 rounded-full transition-[width,background-color,opacity] duration-300 ease-out ${
              index === active ? "w-4 bg-brand" : "w-1.5 bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
