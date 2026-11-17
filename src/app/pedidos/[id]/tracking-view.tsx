"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { CourierMap } from "@/components/courier-map";
import { ChevronLeftIcon } from "@/components/icons";
import { MotoIcon } from "@/components/moto-icon";
import { OrderProgress } from "@/components/order-progress";
import { ReorderButton } from "@/components/reorder-button";
import { addressLabel } from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { distanceMeters, etaMinutes, formatDistance } from "@/lib/geo";
import { useOrders, type Order } from "@/lib/orders";
import { isFinalStatus, type OrderStatus } from "@/lib/order-status";
import { useOrderSync } from "@/lib/order-sync";
import { useBump } from "@/lib/use-bump";
import { merchantWhatsAppUrl } from "@/lib/whatsapp";

/** Cada cuánto preguntamos por el pedido en esta pantalla. */
const POLL_MS = 4000;
/** Si la última ubicación del repartidor es más vieja que esto, no la damos por buena. */
const STALE_MS = 2 * 60 * 1000;

const HEADLINE: Record<OrderStatus, { title: string; line: string }> = {
  recibido: {
    title: "Pedido recibido",
    line: "El comercio ya vio tu pedido. En un ratito lo empiezan a preparar.",
  },
  preparando: {
    title: "Preparando tu pedido",
    line: "Están cocinando lo tuyo. Cuando esté listo sale el repartidor.",
  },
  "en camino": {
    title: "Tu pedido va en camino",
    line: "El repartidor salió hacia tu dirección.",
  },
  entregado: {
    title: "¡Pedido entregado!",
    line: "Que lo disfrutes. Gracias por pedir en Al Toque.",
  },
  cancelado: {
    title: "Pedido cancelado",
    line: "El comercio canceló este pedido. Si tenés dudas, escribile.",
  },
};

/** Reloj que se actualiza solo, para saber qué tan vieja es la ubicación. */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const MAP_BOX = "h-[55dvh] min-h-[320px]";

/** Lo que se ve mientras se lee el pedido del celular: mismas piezas y alturas que la pantalla real. */
export function TrackingSkeleton() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white" aria-hidden>
      <div className={`skeleton ${MAP_BOX}`} />
      <div className="relative -mt-6 space-y-4 rounded-t-3xl bg-white px-4 pt-6 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="skeleton h-7 w-2/3 rounded-md" />
        <div className="skeleton h-4 w-5/6 rounded-md" />
        <div className="skeleton h-12 rounded-2xl" />
        <div className="skeleton h-36 rounded-2xl" />
      </div>
    </div>
  );
}

export function TrackingView({ id }: { id: string }) {
  const orders = useOrders();
  const order = orders?.find((candidate) => candidate.id === id) ?? null;
  // Mantiene el estado al día (4 s) hasta que el pedido se entrega o se cancela.
  const positions = useOrderSync(orders, POLL_MS, id);
  const now = useNow(10000);

  if (orders === null) return <TrackingSkeleton />;
  if (!order) return <UnknownOrder id={id} />;

  const courier = order.serverId ? positions[order.serverId] : undefined;
  return <Tracking order={order} courier={courier} now={now} />;
}

function Tracking({
  order,
  courier,
  now,
}: {
  order: Order;
  courier: { lat: number; lng: number; at?: string } | undefined;
  now: number;
}) {
  const sent = Boolean(order.serverId);
  const status: OrderStatus = order.status ?? "recibido";
  const final = isFinalStatus(status);
  const cancelled = sent && status === "cancelado";
  const bump = useBump(status);

  const delivery =
    typeof order.address?.lat === "number" && typeof order.address?.lng === "number"
      ? { lat: order.address.lat, lng: order.address.lng }
      : null;
  const onTheWay = sent && status === "en camino";
  const courierAge = courier?.at ? now - Date.parse(courier.at) : 0;
  const courierFresh = Boolean(courier) && !(courierAge > STALE_MS);

  const showMap =
    sent && !final && (delivery !== null || (onTheWay && Boolean(courier)));

  let eta: ReactNode = null;
  if (onTheWay) {
    if (courier && courierFresh && delivery) {
      const meters = distanceMeters(courier, delivery);
      eta = (
        <>
          Llega en <strong>~{etaMinutes(meters)} min</strong> ·{" "}
          {formatDistance(meters)}
        </>
      );
    } else if (!courierFresh) {
      eta = "Buscando al repartidor…";
    }
  }

  let headline = HEADLINE[status];
  if (!sent) {
    headline = order.syncFailed
      ? {
          title: "El pedido no llegó al comercio",
          line: "Avisale por WhatsApp para que sepa de tu pedido.",
        }
      : {
          title: "Enviando al comercio…",
          line: "Un segundito: estamos mandando tu pedido.",
        };
  }

  const whatsappUrl = merchantWhatsAppUrl(order);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white">
      <div className={`relative ${MAP_BOX}`}>
        {showMap ? (
          <CourierMap
            delivery={delivery}
            courier={courier ?? null}
            className="h-full w-full"
            animateMs={POLL_MS - 200}
            fitPadding={{ top: 72, right: 48, bottom: 72, left: 48 }}
            showRecenter
            creditBottom={32}
          />
        ) : (
          <StatusHero
            status={status}
            sent={sent}
            syncFailed={Boolean(order.syncFailed)}
          />
        )}
        <Link
          href="/pedidos"
          transitionTypes={["nav-back"]}
          aria-label="Volver a mis pedidos"
          className="absolute left-3 top-[calc(env(safe-area-inset-top)+12px)] z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow-md"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      </div>

      <section className="relative z-10 -mt-6 rounded-t-3xl bg-white px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />

        <div
          key={bump}
          className={`mt-4 ${bump > 0 ? "anim-flash origin-left" : ""}`}
          aria-live="polite"
        >
          <h1
            className={`text-[20px] font-bold leading-tight tracking-tight ${
              cancelled ? "text-red-700" : "text-foreground"
            }`}
          >
            {headline.title}
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {headline.line}
          </p>
        </div>

        {eta ? (
          <div className="anim-fade-in mt-3 flex items-center gap-3 rounded-2xl bg-brand-soft px-3.5 py-2.5 text-[13.5px] text-brand-dark">
            <MotoIcon className="h-7 w-auto shrink-0" moving={courierFresh} />
            <p className="font-semibold">{eta}</p>
          </div>
        ) : null}

        <div className="mt-4">
          {cancelled ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-[12px] font-semibold text-red-700">
              El comercio canceló este pedido.
            </p>
          ) : sent ? (
            <OrderProgress status={status} />
          ) : null}
        </div>

        <div
          className="anim-fade-up mt-5 rounded-2xl border border-line p-3.5"
          style={{ "--i": 1 } as CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 truncate text-[14px] font-bold text-foreground">
              {order.merchantName ?? "Tu pedido"}
            </p>
            <p className="shrink-0 text-[11.5px] font-semibold text-muted">
              Nº {order.id}
            </p>
          </div>

          <ul className="mt-2.5 space-y-1 text-[12.5px]">
            {order.items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted">
                  {item.qty} × {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-3 text-muted">
              <span>Envío</span>
              <span className="tabular-nums">{formatPrice(order.deliveryFee)}</span>
            </li>
          </ul>
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-[14px] font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.total)}</span>
          </div>

          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[12.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Pago</dt>
              <dd className="font-semibold text-foreground">
                {order.payment === "transferencia"
                  ? "Transferencia"
                  : "Efectivo al recibir"}
              </dd>
            </div>
            {order.address ? (
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-muted">Entrega</dt>
                <dd className="text-right font-semibold text-foreground">
                  {addressLabel(order.address)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div
          className="anim-fade-up mt-4 space-y-2"
          style={{ "--i": 2 } as CSSProperties}
        >
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`block rounded-2xl py-3 text-center text-[14px] font-bold ${
                !sent && order.syncFailed
                  ? "bg-brand text-white"
                  : "border border-line text-foreground"
              }`}
            >
              {!sent && order.syncFailed
                ? "Avisar al comercio por WhatsApp"
                : "Escribirle al comercio"}
            </a>
          ) : null}
          {final ? (
            <>
              <ReorderButton order={order} className="py-3 text-[14px]" />
              <Link
                href="/comercios"
                className="block rounded-2xl bg-brand py-3 text-center text-[14px] font-bold text-white"
              >
                Ver comercios
              </Link>
            </>
          ) : null}
          <Link
            href="/pedidos"
            transitionTypes={["nav-back"]}
            className="block py-2 text-center text-[12px] font-medium text-muted"
          >
            Ver todos mis pedidos
          </Link>
        </div>
      </section>
    </div>
  );
}

function UnknownOrder({ id }: { id: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-white px-6 text-center">
      <span className="anim-float mb-2">
        <MotoIcon className="h-14 w-auto" />
      </span>
      <h1 className="mt-3 text-[16px] font-bold text-foreground">
        No encontramos este pedido
      </h1>
      <p className="mt-1 max-w-[18rem] text-[12.5px] leading-relaxed text-muted">
        El pedido {id} no está guardado en este celular. Los pedidos se ven
        solo en el teléfono desde el que se hicieron.
      </p>
      <Link
        href="/pedidos"
        transitionTypes={["nav-back"]}
        className="mt-5 rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        Ir a mis pedidos
      </Link>
    </div>
  );
}

/** Ilustración animada para cuando no hay mapa (todavía): un dibujo por estado. */
function StatusHero({
  status,
  sent,
  syncFailed,
}: {
  status: OrderStatus;
  sent: boolean;
  syncFailed: boolean;
}) {
  const cancelled = sent && status === "cancelado";
  const delivered = sent && status === "entregado";

  return (
    <div
      className={`relative grid h-full w-full place-items-center overflow-hidden ${
        cancelled ? "bg-surface" : "bg-gradient-to-b from-brand-soft to-white"
      }`}
      aria-hidden
    >
      {!sent ? (
        <BagArt pulsing={!syncFailed} />
      ) : cancelled ? (
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-muted shadow-sm">
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </div>
      ) : delivered ? (
        <DeliveredArt />
      ) : status === "preparando" ? (
        <PanArt />
      ) : status === "en camino" ? (
        <RoadArt />
      ) : (
        <BagArt pulsing={false} />
      )}
    </div>
  );
}

/** Bolsa de pedido con aros que laten. */
function BagArt({ pulsing }: { pulsing: boolean }) {
  return (
    <div className="relative grid h-40 w-40 place-items-center">
      {pulsing ? (
        <>
          <span
            className="absolute h-28 w-28 rounded-full bg-brand"
            style={{ animation: "ring-pulse 2.2s ease-out infinite" }}
          />
          <span
            className="absolute h-28 w-28 rounded-full bg-brand"
            style={{ animation: "ring-pulse 2.2s ease-out 1.1s infinite" }}
          />
        </>
      ) : null}
      <svg viewBox="0 0 96 96" className="anim-float relative h-28 w-28" aria-hidden>
        <path d="M30 36 a18 18 0 0 1 36 0" fill="none" stroke="var(--brand-dark)" strokeWidth="5" strokeLinecap="round" />
        <path d="M18 34 h60 l5 48 a4 4 0 0 1 -4 4.4 H17 a4 4 0 0 1 -4 -4.4 Z" fill="var(--brand)" />
        <path d="M18 34 h60 l1 10 H17 Z" fill="var(--brand-dark)" />
        <path d="M38 62 l8 8 l14 -16" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Sartén con vapor. */
function PanArt() {
  return (
    <div className="relative h-40 w-44">
      <svg viewBox="0 0 120 100" className="h-full w-full" aria-hidden>
        {[44, 60, 76].map((x, index) => (
          <path
            key={x}
            d={`M${x} 46 q-6 -8 0 -16 q6 -8 0 -16`}
            fill="none"
            stroke="var(--brand-dark)"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center bottom",
              animation: `steam 1.8s ease-out ${index * 0.45}s infinite`,
            }}
          />
        ))}
        <g className="anim-float">
          <rect x="88" y="62" width="30" height="8" rx="4" fill="var(--foreground)" />
          <path d="M14 58 H92 V70 a18 18 0 0 1 -18 18 H32 a18 18 0 0 1 -18 -18 Z" fill="var(--foreground)" />
          <ellipse cx="53" cy="58" rx="39" ry="6" fill="var(--brand)" />
          <circle cx="40" cy="57" r="3" fill="var(--brand-dark)" />
          <circle cx="56" cy="55.5" r="3.4" fill="var(--brand-dark)" />
          <circle cx="68" cy="58" r="2.6" fill="var(--brand-dark)" />
        </g>
      </svg>
    </div>
  );
}

/** Moto andando por una calle que se desliza (cuando todavía no hay mapa). */
function RoadArt() {
  return (
    <div className="relative w-full">
      <div className="absolute inset-x-0 top-1/2 mt-9 h-12 bg-foreground/10" />
      <div className="absolute inset-x-0 top-1/2 mt-[3.75rem] h-[3px] overflow-hidden">
        <div
          className="h-full w-[calc(100%+32px)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--background) 0 16px, transparent 16px 32px)",
            animation: "road 0.5s linear infinite",
          }}
        />
      </div>
      <div className="relative mx-auto w-fit">
        <span className="moto-bob block" style={{ width: 150, height: 102 }}>
          <MotoIcon className="h-full w-full" moving />
        </span>
      </div>
    </div>
  );
}

/** Tilde grande con papelitos. */
function DeliveredArt() {
  const bits = [
    { left: "18%", delay: "0s", color: "bg-brand" },
    { left: "30%", delay: "0.3s", color: "bg-amber-300" },
    { left: "44%", delay: "0.1s", color: "bg-brand-dark" },
    { left: "58%", delay: "0.45s", color: "bg-amber-300" },
    { left: "70%", delay: "0.2s", color: "bg-brand" },
    { left: "82%", delay: "0.5s", color: "bg-brand-dark" },
  ];
  return (
    <div className="relative grid h-full w-full place-items-center">
      {bits.map((bit) => (
        <span
          key={bit.left}
          className={`absolute top-[22%] h-2.5 w-2.5 rounded-sm ${bit.color}`}
          style={{
            left: bit.left,
            animation: `confetti 2.4s ease-in ${bit.delay} infinite`,
          }}
        />
      ))}
      <div className="anim-pop grid h-28 w-28 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
        <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
    </div>
  );
}
