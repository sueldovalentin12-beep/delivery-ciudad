/**
 * Precios con descuento. Es la ÚNICA cuenta de precios: la usan la página del
 * comercio, el carrito y el servidor al armar el pedido. Así lo que ve el
 * cliente es siempre lo que se le cobra.
 */

import type { Merchant, MenuItem } from "@/lib/demo-data";

export type ItemPrice = {
  /** Lo que se cobra, en pesos enteros. */
  final: number;
  /** El precio de lista, sin descuento. */
  original: number;
  /** Porcentaje de descuento aplicado (0 si no hay). */
  percent: number;
};

/** El precio real de un plato: aplica `discountPercent` y redondea al peso. */
export function itemPrice(
  item: Pick<MenuItem, "price" | "discountPercent">,
): ItemPrice {
  const percent = item.discountPercent ?? 0;
  if (!(percent > 0 && percent < 100)) {
    return { final: item.price, original: item.price, percent: 0 };
  }
  return {
    final: Math.round((item.price * (100 - percent)) / 100),
    original: item.price,
    percent,
  };
}

/**
 * La promo del comercio para mostrar en la tarjeta, sacada de los platos con
 * descuento (nunca un texto libre): "20% off en Muzzarella", o
 * "Hasta 20% off" si hay varios.
 */
export function merchantPromo(merchant: Merchant): string | undefined {
  const discounted = merchant.menu
    .flatMap((section) => section.items)
    .filter((item) => itemPrice(item).percent > 0);
  if (discounted.length === 0) return undefined;
  if (discounted.length === 1) {
    return `${discounted[0].discountPercent}% off en ${discounted[0].name}`;
  }
  const best = Math.max(...discounted.map((item) => itemPrice(item).percent));
  return `Hasta ${best}% off`;
}
