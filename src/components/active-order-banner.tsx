"use client";

import Link from "next/link";
import { MotoIcon } from "@/components/moto-icon";
import { useOrders } from "@/lib/orders";
import { isFinalStatus } from "@/lib/order-status";
import { useOrderSync } from "@/lib/order-sync";
import { useBump } from "@/lib/use-bump";

/**
 * Aviso finito del inicio: si este celular tiene un pedido en curso, lo
 * muestra con su estado y lleva directo al seguimiento. No se pinta hasta
 * hidratar (los pedidos viven en el celular), y se abre con una animación
 * en vez de empujar el contenido de golpe.
 */
export function ActiveOrderBanner() {
  const orders = useOrders();
  const order = orders?.find(
    (candidate) =>
      !isFinalStatus(candidate.status ?? "recibido") &&
      !(candidate.syncFailed && !candidate.serverId),
  );
  // Mantiene el estado al día aunque la persona no pase por "Mis pedidos".
  useOrderSync(orders, 10000, order?.id);

  const status = order?.status ?? "recibido";
  const bump = useBump(order ? status : null);

  if (!order) return null;

  const onTheWay = order.serverId && status === "en camino";
  // Frases completas (no "está + estado"), para que se lean naturales.
  const text = !order.serverId
    ? "Enviando tu pedido al comercio"
    : status === "recibido"
      ? "Tu pedido fue enviado al comercio"
      : status === "preparando"
        ? "Están preparando tu pedido"
        : "Tu pedido va en camino";

  return (
    <div className="anim-banner-in grid px-4 pt-1" style={{ gridTemplateRows: "1fr" }}>
      <div className="min-h-0 overflow-hidden">
        <Link
          href={`/pedidos/${order.id}`}
          className="flex items-center gap-3 rounded-2xl bg-brand-soft px-3.5 py-2.5"
        >
          <span className="grid h-9 w-11 shrink-0 place-items-center">
            {onTheWay ? (
              <MotoIcon className="h-8 w-auto" moving />
            ) : (
              <span className="relative grid h-3 w-3 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold text-brand-dark">
            <span key={bump} className={bump > 0 ? "anim-flash inline-block" : ""}>
              {text}
            </span>
          </span>
          <span className="shrink-0 text-[12px] font-bold text-brand-dark">
            Seguir →
          </span>
        </Link>
      </div>
    </div>
  );
}
