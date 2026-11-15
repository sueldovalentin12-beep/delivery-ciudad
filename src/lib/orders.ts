"use client";

import type { DeliveryAddress } from "@/lib/address";
import type { CartItem } from "@/lib/cart";
import type { OrderStatus } from "@/lib/order-status";

/**
 * Historial de pedidos confirmados.
 * La copia principal vive en la base de datos; esta es la copia del celular
 * del cliente, para su historial y seguimiento.
 */

export type Order = {
  id: string;
  createdAt: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address?: DeliveryAddress;
  /** El id con el que quedó guardado en el servidor (si se pudo sincronizar). */
  serverId?: string;
  /** Estado actual del pedido (se actualiza preguntando al servidor). */
  status?: OrderStatus;
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

/** Genera un número de pedido único (no se repite entre pedidos viejos). */
function generateOrderId(existing: Order[]): string {
  // Fecha en base 36 + sufijo al azar: prácticamente imposible que se repita.
  let id = "";
  do {
    id =
      "AT-" +
      Date.now().toString(36).toUpperCase() +
      String(Math.floor(Math.random() * 90) + 10);
  } while (existing.some((order) => order.id === id));
  return id;
}

/** Guarda el pedido y devuelve el número de pedido generado. */
export function saveOrder(order: Omit<Order, "id" | "createdAt">): Order {
  const previous = readOrders();
  const full: Order = {
    ...order,
    id: generateOrderId(previous),
    createdAt: Date.now(),
  };

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([full, ...previous].slice(0, 20)),
    );
  } catch {
    // Si no se puede guardar, igual mostramos la confirmación.
  }

  return full;
}

/** Actualiza el pedido guardado en el celular y devuelve la lista nueva. */
function updateOrder(id: string, patch: Partial<Order>): void {
  try {
    const orders = readOrders();
    const next = orders.map((order) =>
      order.id === id ? { ...order, ...patch } : order,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Sin espacio: el cambio vive solo en memoria.
  }
}

/** Anota que el pedido quedó guardado en el servidor. */
export function markOrderServer(id: string, serverId: string): void {
  updateOrder(id, { serverId });
}

/** Anota el estado del pedido (Recibido, En camino, Entregado…). */
export function markOrderStatus(id: string, status: OrderStatus): void {
  updateOrder(id, { status });
}

/** Borra todo el historial de pedidos guardado en el celular. */
export function clearOrders(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar.
  }
}
