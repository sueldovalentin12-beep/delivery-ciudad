"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { CourierMap, type MapPoint } from "@/components/courier-map";
import { addressLabel } from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { markOrderStatus } from "@/lib/orders";
import { readOrders, type Order } from "@/lib/orders";
import { STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/lib/order-status";

export function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  /** Última ubicación conocida del repartidor, por id de pedido en el servidor. */
  const [positions, setPositions] = useState<Record<string, MapPoint>>({});

  useEffect(() => {
    setOrders(readOrders());
  }, []);

  // Consulta al servidor el estado de los pedidos que no terminaron y,
  // si el repartidor está en camino, también su ubicación.
  const refresh = useCallback(async () => {
    const local = readOrders();
    setOrders(local);
    const tracking = local.filter(
      (order) => order.serverId && order.status !== "entregado",
    );
    if (tracking.length === 0) return;
    const results = await Promise.allSettled(
      tracking.map(async (order) => {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(order.serverId as string)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as {
          id: string;
          status: string;
          position: MapPoint | null;
        };
      }),
    );
    const nextPositions: Record<string, MapPoint> = {};
    for (let index = 0; index < tracking.length; index += 1) {
      const settled = results[index];
      if (settled.status !== "fulfilled") continue;
      const order = tracking[index];
      const data = settled.value;
      if (isOrderStatus(data.status)) {
        markOrderStatus(order.id, data.status as OrderStatus);
        setOrders((current) =>
          current
            ? current.map((entry) =>
                entry.id === order.id ? { ...entry, status: data.status as OrderStatus } : entry,
              )
            : current,
        );
      }
      if (data.position) nextPositions[data.id] = data.position;
    }
    setPositions(nextPositions);
  }, []);

  // Refresco al abrir y cada 8 segundos mientras hay pedidos en curso.
  useEffect(() => {
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (orders === null) {
    return (
      <div className="space-y-2.5" aria-hidden>
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <EmptyState
          emoji="🧾"
          title="Todavía no hiciste pedidos"
          description="Cuando confirmes uno, acá vas a poder ver su estado."
        />
        <Link
          href="/comercios"
          className="mx-auto mt-2 block w-fit rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white"
        >
          Ver comercios
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          position={order.serverId ? positions[order.serverId] ?? null : null}
        />
      ))}
    </ul>
  );
}

function OrderCard({
  order,
  position,
}: {
  order: Order;
  position: MapPoint | null;
}) {
  const status: OrderStatus = order.status ?? "recibido";
  const showMap = order.address?.lat != null && order.address?.lng != null;

  return (
    <li
      key={order.id}
      className="rounded-2xl border border-line p-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13.5px] font-bold text-foreground">
          {order.id}
        </span>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-dark">
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mt-0.5 text-[11.5px] text-muted">
        {formatDate(order.createdAt)}
      </p>
      {order.address ? (
        <p className="mt-1 text-[12px] text-muted">
          📍 {addressLabel(order.address)}
        </p>
      ) : null}
      <ul className="mt-2 space-y-1 text-[12px]">
        {order.items.slice(0, 3).map((item) => (
          <li key={item.key} className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-muted">
              {item.qty} × {item.name}
            </span>
            <span className="shrink-0 tabular-nums text-foreground">
              {formatPrice(item.price * item.qty)}
            </span>
          </li>
        ))}
        {order.items.length > 3 ? (
          <li className="text-[11.5px] text-muted">
            y {order.items.length - 3} más…
          </li>
        ) : null}
      </ul>
      <div className="mt-2 flex justify-between border-t border-line pt-2 text-[13px] font-bold">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(order.total)}</span>
      </div>

      {showMap && status !== "entregado" ? (
        <div className="mt-2.5">
          <CourierMap
            delivery={{
              lat: order.address?.lat as number,
              lng: order.address?.lng as number,
            }}
            courier={position}
          />
        </div>
      ) : null}
    </li>
  );
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
