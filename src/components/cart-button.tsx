"use client";

import { QtyStepper } from "@/components/qty-stepper";
import { buildItemKey, useCart } from "@/lib/cart";

/**
 * Botón de un plato del menú del comercio.
 * Si el plato todavía no está en el carrito muestra un "+".
 * Si ya está, se transforma en "- 2 +" para cambiar la cantidad.
 */
export function CartButton({
  merchantSlug,
  merchantName,
  itemId,
  name,
  price,
  emoji,
}: {
  merchantSlug: string;
  merchantName: string;
  itemId: string;
  name: string;
  price: number;
  emoji: string;
}) {
  const { add, changeQty, qtyOf } = useCart();
  const key = buildItemKey(merchantSlug, itemId);
  const qty = qtyOf(key);

  return (
    <QtyStepper
      qty={qty}
      itemName={name}
      onIncrement={() =>
        add({ key, merchantSlug, merchantName, name, price, emoji })
      }
      onDecrement={() => changeQty(key, -1)}
    />
  );
}
