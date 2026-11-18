import Link from "next/link";
import type { ReactNode } from "react";

/** Estado vacío: ilustración, título, una línea y un botón de salida. */
export function EmptyState({
  illustration,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  illustration: ReactNode;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 pb-6 pt-10 text-center">
      <div
        className="grid h-36 w-36 place-items-center rounded-full bg-brand-soft"
        aria-hidden
      >
        {illustration}
      </div>
      <h2 className="mt-6 text-[18px] font-extrabold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-muted">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="mt-6 block w-full rounded-full bg-brand px-5 py-3 text-[14px] font-bold text-white transition active:scale-[0.99]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

/** Bolsa de compras en verde de la marca, para el carrito vacío. */
export function BagIllustration({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden>
      <path
        d="M24 34h48l4 44a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6l4-44Z"
        fill="var(--brand)"
      />
      <path
        d="M34 42v-8a14 14 0 0 1 28 0v8"
        stroke="var(--brand-dark)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M38 56c2 6 6 9 10 9s8-3 10-9"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
