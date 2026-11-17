"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { findMenuItem } from "@/lib/demo-data";
import { writeStored } from "@/lib/local-store";
import type { Order } from "@/lib/orders";

/**
 * "Repetir pedido": arma el carrito con los mismos productos de un pedido
 * anterior y lleva al carrito para confirmarlo.
 * Solo guardamos qué producto y cuántos: nombre y precio se vuelven a leer
 * del catálogo, así nunca se repite un pedido con precios viejos.
 */

const CART_KEY = "altoque.cart.v1";

/** Los productos del pedido que siguen existiendo en el catálogo. */
function availableItems(order: Order) {
  return order.items.filter((item) => {
    const colon = item.key.indexOf(":");
    if (colon <= 0) return false;
    return Boolean(findMenuItem(item.key.slice(0, colon), item.key.slice(colon + 1)));
  });
}

export function ReorderButton({
  order,
  className = "",
}: {
  order: Order;
  className?: string;
}) {
  const router = useRouter();
  const { count } = useCart();
  /** Si ya hay algo en el carrito, pedimos confirmar antes de reemplazarlo. */
  const [asking, setAsking] = useState(false);
  const items = availableItems(order);

  if (items.length === 0) return null;

  function repeat() {
    writeStored(
      CART_KEY,
      JSON.stringify(items.map((item) => ({ key: item.key, qty: item.qty }))),
    );
    router.push("/carrito");
  }

  if (asking) {
    return (
      <div
        className={`rounded-xl border border-line bg-surface p-2.5 text-[12px] ${className}`}
      >
        <p className="font-semibold text-foreground">
          Esto reemplaza lo que tenés en el carrito.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={repeat}
            className="flex-1 rounded-full bg-brand py-2 text-[12.5px] font-bold text-white"
          >
            Reemplazar
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="flex-1 rounded-full border border-line bg-white py-2 text-[12.5px] font-semibold text-foreground"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (count > 0 ? setAsking(true) : repeat())}
      className={`w-full rounded-full border border-brand bg-brand-soft py-2 text-[12.5px] font-bold text-brand-dark transition active:scale-[0.99] ${className}`}
    >
      Repetir pedido
      {items.length < order.items.length ? " (lo que sigue disponible)" : ""}
    </button>
  );
}
