import Link from "next/link";
import { ClockIcon, HeartIcon, ScooterIcon, StarIcon } from "@/components/icons";
import type { Merchant } from "@/lib/demo-data";

export function VendorCard({ merchant }: { merchant: Merchant }) {
  return (
    <Link href={`/comercio/${merchant.slug}`} className="block w-[15rem] shrink-0">
      <div
        className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br ${merchant.gradient}`}
      >
        <span
          className="absolute inset-0 grid place-items-center text-[3.25rem] drop-shadow-sm"
          aria-hidden
        >
          {merchant.emoji}
        </span>

        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-foreground/70 backdrop-blur">
          <HeartIcon />
        </span>

        {merchant.promo ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-brand-dark">
            {merchant.promo}
          </span>
        ) : null}
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="truncate text-[13.5px] font-semibold text-foreground">
          {merchant.name}
        </h3>
        <p className="truncate text-[11.5px] text-muted">{merchant.category}</p>
        <div className="flex items-center gap-2 pt-0.5 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <ClockIcon />
            {merchant.deliveryMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <ScooterIcon />
            {merchant.deliveryFee}
          </span>
          <span className="flex items-center gap-1 font-semibold text-brand-dark">
            <StarIcon />
            {merchant.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}
