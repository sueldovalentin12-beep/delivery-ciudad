"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MotoIcon } from "@/components/moto-icon";
import { OrderProgress } from "@/components/order-progress";
import { ReorderButton } from "@/components/reorder-button";
import { addressLabel } from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { useOrders, type Order } from "@/lib/orders";
import { CUSTOMER_STATUS_LABEL, isFinalStatus, type OrderStatus } from "@/lib/order-status";
import { useOrderSync } from "@/lib/order-sync";
import { useBump } from "@/lib/use-bump";
import { merchantWhatsAppUrl } from "@/lib/whatsapp";

/** Lista de pedidos: livianos, cada uno lleva a su pantalla de seguimiento. */
export function OrdersView() {
  const orders = useOrders();

  // Al abrir y cada 8 segundos mientras hay pedidos en curso y la pantalla está a la vista:
  // reenvía lo que no llegó y consulta el estado de lo que sigue en curso.
  useOrderSync(orders, 8000);

  if (orders === null) {
    // Mismo alto que los pedidos reales: no hay salto cuando aparecen.
    return (
      <div className="min-h-[60dvh] space-y-2.5" aria-hidden>
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="anim-fade-in min-h-[60dvh]">
        <EmptyState
          illustration={<MotoIcon className="h-16 w-auto" />}
          title="Todavía no hiciste pedidos"
          description="Cuando confirmes uno, acá vas a poder ver su estado."
          ctaHref="/comercios"
          ctaLabel="Hacer un pedido"
        />
      </div>
    );
  }

  return (
    <ul className="min-h-[60dvh] space-y-2.5">
      {orders.map((order, index) => (
        <OrderCard key={order.id} order={order} index={index} />
      ))}
    </ul>
  );
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const status: OrderStatus = order.status ?? "recibido";
  const sent = Boolean(order.serverId);
  const cancelled = sent && status === "cancelado";
  const whatsappUrl = order.syncFailed ? merchantWhatsAppUrl(order) : null;
  const bump = useBump(sent ? status : null);
  const pillClass = `shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${
    bump > 0 ? "anim-flash" : ""
  }`;

  return (
    <li
      className="anim-fade-up relative rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Toda la tarjeta lleva al seguimiento; el botón de WhatsApp va por encima. */}
      <Link
        href={`/pedidos/${order.id}`}
        aria-label={`Seguir el pedido ${order.id}`}
        className="absolute inset-0 rounded-2xl"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold text-foreground">
            {order.merchantName || "Tu pedido"}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {order.id} · {formatDate(order.createdAt)}
          </p>
        </div>
        {!sent ? (
          <span className={`${pillClass} bg-surface text-muted`}>
            Sin confirmar
          </span>
        ) : cancelled ? (
          <span key={bump} className={`${pillClass} bg-red-50 text-red-700`}>
            {CUSTOMER_STATUS_LABEL[status]}
          </span>
        ) : (
          <span key={bump} className={`${pillClass} bg-brand-soft text-brand-dark`}>
            {CUSTOMER_STATUS_LABEL[status]}
          </span>
        )}
      </div>
      {order.address ? (
        <p className="mt-2 text-[12px] text-muted">
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

      {!sent ? (
        order.syncFailed ? (
          <div className="relative z-10 mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] font-semibold text-amber-800">
            <p>⚠️ Este pedido no llegó al comercio: avisales por WhatsApp.</p>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-block rounded-full bg-brand px-3.5 py-1.5 text-[12px] font-bold text-white"
              >
                Avisar por WhatsApp
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-2.5 text-[11.5px] text-muted">
            Enviando al comercio…
          </p>
        )
      ) : cancelled ? (
        <p className="mt-2.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[12px] font-semibold text-red-700">
          El comercio canceló este pedido.
        </p>
      ) : (
        <div className="mt-2.5 space-y-1.5">
          <OrderProgress status={status} />
          <p className="flex items-center justify-between text-[12px] text-muted">
            <span>{PROGRESS_TEXT[status]}</span>
            <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-[12.5px] font-bold text-brand-dark">
              Seguir →
            </span>
          </p>
        </div>
      )}

      {/* Pedido terminado: se puede volver a pedir lo mismo con un toque. */}
      {sent && isFinalStatus(status) ? (
        <ReorderButton order={order} className="relative z-10 mt-2.5" />
      ) : null}
    </li>
  );
}

const PROGRESS_TEXT: Record<OrderStatus, string> = {
  recibido: "Esperando que el comercio lo confirme.",
  preparando: "Lo están preparando.",
  "en camino": "Va en camino.",
  entregado: "Entregado. ¡Que lo disfrutes!",
  cancelado: "El comercio canceló este pedido.",
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
