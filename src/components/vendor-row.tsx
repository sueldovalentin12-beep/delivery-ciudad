"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import { ClosedChip, OpenLabel } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { RatingOrNew } from "@/components/vendor-card";
import type { Merchant } from "@/lib/demo-data";
import { useOpenStatus } from "@/lib/use-open-status";

export function VendorRow({ merchant }: { merchant: Merchant }) {
  const status = useOpenStatus(merchant);
  const closed = status !== null && !status.open;

  return (
    <Link
      href={`/comercio/${merchant.slug}`}
      className={`flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 transition hover:border-brand/40 ${
        closed ? "opacity-70" : ""
      }`}
    >
      <span className="relative h-16 w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-surface">
        <Photo
          src={merchant.photo}
          emoji={merchant.emoji}
          gradient={merchant.gradient}
          sizes="96px"
          emojiClassName="text-2xl"
        />
        <ClosedChip merchant={merchant} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">
          {merchant.name}
        </span>
        <span className="block truncate text-[11.5px] text-muted">{merchant.category}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted">
          <span className="truncate">
            {merchant.deliveryMinutes} min · Envío {merchant.deliveryFee}
          </span>
          <RatingOrNew merchant={merchant} />
        </span>
        <OpenLabel merchant={merchant} />
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
