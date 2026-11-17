"use client";

import { useRef, useState } from "react";
import type { MapPoint } from "@/components/courier-map";
import {
  markOrderServer,
  markOrderStatus,
  markOrderSyncFailed,
  readOrders,
  type Order,
} from "@/lib/orders";
import { isFinalStatus, isOrderStatus } from "@/lib/order-status";
import { usePolling } from "@/lib/use-polling";

/**
 * Sincronización de los pedidos del celular con el servidor.
 * La usan "Mis pedidos", la pantalla de seguimiento y el aviso del inicio:
 * reenvía lo que no llegó y consulta el estado (y la ubicación del
 * repartidor) de lo que sigue en curso.
 */

/** Ubicación del repartidor tal como la devuelve el servidor. */
export type CourierPoint = MapPoint & { at?: string };

/** ¿Este pedido todavía necesita que le preguntemos algo al servidor? */
export function needsSync(order: Order): boolean {
  if (!order.serverId) return !order.syncFailed;
  return !isFinalStatus(order.status ?? "recibido");
}

/** Manda de nuevo un pedido que no había llegado (el servidor lo ignora si ya lo tiene). */
async function resendOrder(order: Order): Promise<void> {
  if (!order.customerName || !order.customerPhone || !order.address) {
    // Pedido viejo, sin datos de contacto: el servidor no lo aceptaría.
    markOrderSyncFailed(order.id);
    return;
  }
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: order.id,
      items: order.items.map((item) => ({ key: item.key, qty: item.qty })),
      address: order.address,
      customer: { name: order.customerName, phone: order.customerPhone },
      notes: order.notes,
      payment: order.payment ?? "efectivo",
    }),
  });
  if (response.ok) {
    const data = (await response.json().catch(() => ({}))) as { id?: string };
    markOrderServer(order.id, data.id ?? order.id);
    markOrderStatus(order.id, "recibido");
  } else if (response.status === 400) {
    markOrderSyncFailed(order.id);
  }
  // 500/503: queda para el próximo intento.
}

/**
 * Una vuelta de sincronización. Devuelve la última ubicación conocida del
 * repartidor por id de pedido en el servidor.
 */
async function syncOrders(
  scope: (order: Order) => boolean,
): Promise<Record<string, CourierPoint>> {
  for (const order of readOrders()) {
    if (!scope(order) || order.serverId || order.syncFailed) continue;
    try {
      await resendOrder(order);
    } catch {
      // Sin internet: se reintenta en el próximo ciclo.
    }
  }

  const tracking = readOrders().filter(
    (order) =>
      scope(order) &&
      order.serverId &&
      !isFinalStatus(order.status ?? "recibido"),
  );
  const positions: Record<string, CourierPoint> = {};
  await Promise.all(
    tracking.map(async (order) => {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(order.serverId as string)}`,
          { cache: "no-store" },
        );
        // 404: el servidor no lo conoce (por ejemplo, se reinició): dejamos el último estado.
        if (!response.ok) return;
        const data = (await response.json()) as {
          id: string;
          status: string;
          position: CourierPoint | null;
        };
        if (isOrderStatus(data.status) && data.status !== order.status) {
          markOrderStatus(order.id, data.status);
        }
        if (data.position) positions[data.id] = data.position;
      } catch {
        // Sin conexión: seguimos con lo último que sabíamos.
      }
    }),
  );
  return positions;
}

/**
 * Mantiene al día los pedidos mientras la pantalla está a la vista: al abrir
 * y cada `intervalMs`, hasta que no quede ninguno en curso.
 * `orderId` limita la vuelta a un solo pedido. Devuelve las ubicaciones del
 * repartidor, por id de pedido en el servidor.
 */
export function useOrderSync(
  orders: Order[] | null,
  intervalMs: number,
  orderId?: string,
): Record<string, CourierPoint> {
  const [positions, setPositions] = useState<Record<string, CourierPoint>>({});
  const busyRef = useRef(false);

  const inScope = (order: Order) => !orderId || order.id === orderId;

  async function refresh() {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const next = await syncOrders(inScope);
      setPositions((current) => ({ ...current, ...next }));
    } finally {
      busyRef.current = false;
    }
  }

  usePolling(
    () => void refresh(),
    intervalMs,
    orders !== null && orders.filter(inScope).some(needsSync),
  );

  return positions;
}
