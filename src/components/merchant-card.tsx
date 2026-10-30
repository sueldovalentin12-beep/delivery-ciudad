import type { Merchant } from "@/lib/demo-data";

export function MerchantCard({ merchant }: { merchant: Merchant }) {
  return (
    <article className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm transition hover:border-brand/40 hover:shadow-md">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-3xl ${merchant.tint}`}
      >
        <span aria-hidden>{merchant.emoji}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="space-y-0.5">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {merchant.name}
          </h3>
          <p className="truncate text-xs text-muted">{merchant.category}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-semibold text-foreground">
            ★ {merchant.rating.toFixed(1)}
          </span>
          <span aria-hidden>·</span>
          <span>{merchant.deliveryMinutes} min</span>
          <span aria-hidden>·</span>
          <span>{merchant.deliveryFee} de envío</span>
        </div>
      </div>
    </article>
  );
}
