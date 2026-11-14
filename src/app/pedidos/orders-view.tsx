"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { formatPrice } from "@/lib/demo-data";
import { readOrders, type Order } from "@/lib/orders";

export function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    setOrders(readOrders());
  }, []);

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
        <li
          key={order.id}
          className="rounded-2xl border border-line p-3.5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] font-bold text-foreground">
              {order.id}
            </span>
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-dark">
              Recibido
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {formatDate(order.createdAt)}
          </p>
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
        </li>
      ))}
    </ul>
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
