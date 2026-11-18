"use client";

import Link from "next/link";
import { ClockIcon, ScooterIcon, StarIcon } from "@/components/icons";
import { ClosedChip, OpenLabel } from "@/components/open-status";
import { Photo } from "@/components/photo";
import type { Merchant } from "@/lib/demo-data";
import { merchantPromo } from "@/lib/pricing";
import { useOpenStatus } from "@/lib/use-open-status";

/** Chip chico: "Nuevo" cuando todavía no hay calificaciones, o la estrella. */
export function RatingOrNew({ merchant }: { merchant: Merchant }) {
  if (merchant.rating === undefined) {
    return (
      <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">
        Nuevo
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 font-semibold text-brand-dark">
      <StarIcon />
      {merchant.rating.toFixed(1)}
    </span>
  );
}

export function VendorCard({ merchant }: { merchant: Merchant }) {
  const status = useOpenStatus(merchant);
  const closed = status !== null && !status.open;
  const promo = merchantPromo(merchant);

  return (
    <Link
      href={`/comercio/${merchant.slug}`}
      className={`block w-[15rem] shrink-0 transition-[opacity,transform] duration-200 motion-safe:active:scale-[0.97] ${
        closed ? "opacity-70" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
        <Photo
          src={merchant.photo}
          emoji={merchant.emoji}
          gradient={merchant.gradient}
          sizes="240px"
          emojiClassName="text-[3.25rem]"
        />
        <ClosedChip merchant={merchant} />

        {merchant.rating === undefined && !closed ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-brand-dark shadow-sm">
            Nuevo
          </span>
        ) : null}

        {promo ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            {promo}
          </span>
        ) : null}
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="truncate text-[14px] font-bold text-foreground">{merchant.name}</h3>
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
          {merchant.rating !== undefined ? (
            <>
              <RatingOrNew merchant={merchant} />
              <span aria-hidden>·</span>
            </>
          ) : null}
          <span className="truncate">{merchant.category}</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5 text-[11.5px] text-muted">
          <span className="flex items-center gap-1">
            <ClockIcon />
            {merchant.deliveryMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <ScooterIcon />
            {merchant.deliveryFee}
          </span>
        </div>
        <OpenLabel merchant={merchant} />
      </div>
    </Link>
  );
}
