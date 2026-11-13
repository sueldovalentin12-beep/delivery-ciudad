import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";
import type { Merchant } from "@/lib/demo-data";

export function VendorRow({ merchant }: { merchant: Merchant }) {
  return (
    <Link
      href={`/comercio/${merchant.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 transition hover:border-brand/40"
    >
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-2xl ${merchant.gradient}`}
        aria-hidden
      >
        {merchant.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">
          {merchant.name}
        </span>
        <span className="block truncate text-[11.5px] text-muted">{merchant.category}</span>
        <span className="mt-0.5 block text-[11.5px] text-muted">
          {merchant.deliveryMinutes} min · Envío {merchant.deliveryFee}
        </span>
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
