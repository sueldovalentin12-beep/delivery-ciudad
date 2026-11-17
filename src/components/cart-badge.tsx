"use client";

import Link from "next/link";
import { CartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { useBump } from "@/lib/use-bump";

/** Ícono de carrito del encabezado, con la cantidad de productos encima. */
export function CartBadge() {
  const { count, ready } = useCart();
  const bump = useBump(ready ? count : null);

  return (
    <Link
      href="/carrito"
      aria-label={
        count > 0 ? `Ver carrito, ${count} productos` : "Ver carrito"
      }
      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-foreground"
    >
      <CartIcon />
      {count > 0 ? (
        <span
          key={bump}
          className={`absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white ${
            bump > 0 ? "anim-pop" : ""
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
