"use client";

import Link from "next/link";
import { useBump } from "@/lib/use-bump";
import { useCart } from "@/lib/cart";
import { formatPrice, getMerchantBySlug } from "@/lib/demo-data";

/**
 * Barra verde que aparece arriba del menú de abajo cuando hay algo en el carrito.
 * Es el atajo para ir a pagar sin volver al inicio. Siempre está montada y se
 * desliza hacia arriba al aparecer (no empuja el contenido: la página ya deja
 * lugar abajo), y da un saltito cada vez que se agrega algo.
 */
export function CartSummaryBar() {
  const { count, subtotal, ready, merchantSlug } = useCart();
  const bump = useBump(ready ? count : null);
  const visible = ready && count > 0;

  // El envío es el del comercio del carrito.
  const deliveryFee = merchantSlug
    ? (getMerchantBySlug(merchantSlug)?.deliveryFeeValue ?? 0)
    : 0;

  return (
    <div
      aria-hidden={!visible || undefined}
      inert={!visible}
      className={`fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 px-4 pb-2 transition-[transform,opacity] duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <Link
        key={bump}
        href="/carrito"
        className={`mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-3 text-white shadow-lg shadow-brand/25 ${
          bump > 0 ? "anim-bump" : ""
        }`}
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <span
            key={bump}
            className={`grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1 text-[11px] font-bold tabular-nums ${
              bump > 0 ? "anim-pop" : ""
            }`}
          >
            {count}
          </span>
          Ver mi pedido
        </span>
        <span className="text-[14.5px] font-bold tabular-nums">
          {formatPrice(subtotal + deliveryFee)}
        </span>
      </Link>
    </div>
  );
}
