"use client";

import type { DeliveryAddress } from "@/lib/address";
import type { CartItem } from "@/lib/cart";

/**
 * Historial de pedidos confirmados.
 * También vive en el celular del cliente (localStorage). Es provisorio:
 * en la Etapa 4 cada pedido se guarda en la base de datos y lo ve el comercio.
 */

export type Order = {
  id: string;
  createdAt: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address?: DeliveryAddress;
};

const STORAGE_KEY = "altoque.orders.v1";

export function readOrders(): Order[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is Order =>
        typeof value === "object" &&
        value !== null &&
        typeof (value as Order).id === "string" &&
        Array.isArray((value as Order).items),
    );
  } catch {
    return [];
  }
}

/** Guarda el pedido y devuelve el número de pedido generado. */
export function saveOrder(order: Omit<Order, "id" | "createdAt">): Order {
  const full: Order = {
    ...order,
    id: "AT-" + String(Math.floor(1000 + Math.random() * 9000)),
    createdAt: Date.now(),
  };

  try {
    const previous = readOrders();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([full, ...previous].slice(0, 20)),
    );
  } catch {
    // Si no se puede guardar, igual mostramos la confirmación.
  }

  return full;
}
