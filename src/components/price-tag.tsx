import { formatPrice } from "@/lib/demo-data";
import { itemPrice } from "@/lib/pricing";
import type { MenuItem } from "@/lib/demo-data";

/**
 * El precio de un plato. Con descuento muestra el precio de lista tachado y
 * el "−20%"; sin descuento, solo el precio.
 */
export function PriceTag({
  item,
  className = "text-[12.5px]",
}: {
  item: Pick<MenuItem, "price" | "discountPercent">;
  className?: string;
}) {
  const { final, original, percent } = itemPrice(item);
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className={`font-semibold tabular-nums text-foreground ${className}`}>
        {formatPrice(final)}
      </span>
      {percent > 0 ? (
        <>
          <s className="text-[11px] tabular-nums text-muted">{formatPrice(original)}</s>
          <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">
            −{percent}%
          </span>
        </>
      ) : null}
    </span>
  );
}
