"use client";

import { useMemo } from "react";
import type { DeliveryAddress } from "@/lib/address";
import type { CartItem } from "@/lib/cart";
import { readStored, useStored, writeStored } from "@/lib/local-store";
import type { OrderStatus } from "@/lib/order-status";

/**
 * Historial de pedidos confirmados.
 * La copia principal vive en la base de datos; esta es la copia del celular
 * del cliente, para su historial y seguimiento.
 */

export type PaymentMethod = "efectivo" | "transferencia";

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
  // Los campos de abajo son opcionales para poder leer pedidos viejos.
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  payment?: PaymentMethod;
  merchantSlug?: string;
  merchantName?: string;
  /** El servidor rechazó el pedido: ya no se reintenta el envío. */
  syncFailed?: boolean;
};

const STORAGE_KEY = "altoque.orders.v1";

function parseOrders(raw: string | null): Order[] {
  if (!raw) return [];
  try {
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

export function readOrders(): Order[] {
  return parseOrders(readStored(STORAGE_KEY));
}

/** Los pedidos guardados. `null` hasta que la pantalla terminó de hidratar. */
export function useOrders(): Order[] | null {
  const raw = useStored(STORAGE_KEY);
  return useMemo(() => (raw === undefined ? null : parseOrders(raw)), [raw]);
}

/** Genera un número de pedido único (no se repite entre pedidos viejos). */
export function newOrderId(): string {
  const existing = readOrders();
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

/** Guarda el pedido (con el número ya generado) y lo devuelve. */
export function saveOrder(
  order: Omit<Order, "id" | "createdAt"> & { id?: string },
): Order {
  const previous = readOrders();
  const full: Order = {
    ...order,
    id: order.id ?? newOrderId(),
    createdAt: Date.now(),
  };
  writeStored(STORAGE_KEY, JSON.stringify([full, ...previous].slice(0, 20)));
  return full;
}

function updateOrder(id: string, patch: Partial<Order>): void {
  const next = readOrders().map((order) =>
    order.id === id ? { ...order, ...patch } : order,
  );
  writeStored(STORAGE_KEY, JSON.stringify(next));
}

/** Anota que el pedido quedó guardado en el servidor. */
export function markOrderServer(id: string, serverId: string): void {
  updateOrder(id, { serverId, syncFailed: undefined });
}

/** Anota el estado del pedido (Recibido, En camino, Entregado…). */
export function markOrderStatus(id: string, status: OrderStatus): void {
  updateOrder(id, { status });
}

/** Anota que el servidor rechazó el pedido, para no reintentarlo más. */
export function markOrderSyncFailed(id: string): void {
  updateOrder(id, { syncFailed: true });
}

/** Borra todo el historial de pedidos guardado en el celular. */
export function clearOrders(): void {
  writeStored(STORAGE_KEY, null);
}
