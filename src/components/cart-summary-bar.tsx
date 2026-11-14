"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { appConfig } from "@/lib/config";
import { formatPrice } from "@/lib/demo-data";

/**
 * Barra verde que aparece arriba del menú de abajo cuando hay algo en el carrito.
 * Es el atajo para ir a pagar sin volver al inicio.
 */
export function CartSummaryBar() {
  const { count, subtotal, ready } = useCart();

  if (!ready || count === 0) return null;

  return (
    <>
      {/* Espacio para que la barra no tape la última comida del menú. */}
      <div className="h-20" aria-hidden />

      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 px-4 pb-2">
        <Link
          href="/carrito"
          className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-3 text-white shadow-lg shadow-brand/25 transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1 text-[11px] font-bold tabular-nums">
              {count}
            </span>
            Ver mi pedido
          </span>
          <span className="text-[14.5px] font-bold tabular-nums">
            {formatPrice(subtotal + appConfig.deliveryFeeValue)}
          </span>
        </Link>
      </div>
    </>
  );
}
