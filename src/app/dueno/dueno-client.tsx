"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  addressLabel,
  mapsUrl,
  type DeliveryAddress,
} from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

/**
 * Panel del dueño: ve los pedidos que entran y los va pasando de estado.
 * La lista se refresca sola cada 5 segundos mientras la pantalla está abierta.
 */

type PanelOrder = {
  id: string;
  merchantName: string;
  items: { name: string; qty: number; price: number; emoji?: string }[];
  address: DeliveryAddress | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

const PIN_KEY = "altoque.owner-pin.v1";

/** Botón siguiente según el estado actual del pedido. */
const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  recibido: { label: "🍳 Empezar a preparar", next: "preparando" },
  preparando: { label: "🛵 Salida en camino", next: "en camino" },
  "en camino": { label: "✅ Marcar entregado", next: "entregado" },
};

export function DuenoClient() {
  const [pin, setPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PanelOrder[] | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Recupera el PIN de la sesión anterior en el mismo navegador.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(PIN_KEY);
      if (saved) setPin(saved);
    } catch {
      // Modo incógnito: se pide el PIN cada vez.
    }
  }, []);

  const loadOrders = useCallback(
    async (currentPin: string) => {
      try {
        const response = await fetch("/api/orders", {
          headers: { "x-altoque-pin": currentPin },
          cache: "no-store",
        });
        if (response.status === 401) {
          setPinError("El PIN no es correcto.");
          window.sessionStorage.removeItem(PIN_KEY);
          setPin(null);
          return;
        }
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          setDbError(data.error ?? "No se pudieron cargar los pedidos.");
          return;
        }
        setDbError(null);
        setPinError(null);
        const data = (await response.json()) as { orders: PanelOrder[] };
        setOrders(data.orders);
      } catch {
        setDbError("Sin conexión con el servidor. Revisá tu internet.");
      }
    },
    [],
  );

  // Carga inicial + refresco cada 5 segundos.
  useEffect(() => {
    if (!pin) return;
    void loadOrders(pin);
    const timer = setInterval(() => void loadOrders(pin), 5000);
    return () => clearInterval(timer);
  }, [pin, loadOrders]);

  function enterPin(event: React.FormEvent) {
    event.preventDefault();
    const clean = pinInput.trim();
    if (!clean) return;
    setPinError(null);
    setPin(clean); // La validación real la hace el primer pedido al servidor.
    window.sessionStorage.setItem(PIN_KEY, clean);
  }

  async function changeStatus(order: PanelOrder, next: OrderStatus) {
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-altoque-pin": pin ?? "",
        },
        body: JSON.stringify({ status: next }),
      });
      if (response.ok) void loadOrders(pin ?? "");
    } catch {
      // El refresco de 5 segundos lo va a reintentar.
    }
  }

  if (!pin) {
    return (
      <PageShell title="Panel del dueño">
        <form onSubmit={enterPin} className="space-y-3 pt-6">
          <p className="text-[13px] text-muted">
            Ingresá el PIN del comercio para ver los pedidos que entran.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={pinInput}
            onChange={(event) => setPinInput(event.target.value)}
            placeholder="PIN"
            aria-label="PIN del comercio"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-center text-[18px] font-bold tracking-[0.3em] text-foreground outline-none focus:border-brand"
          />
          {pinError ? (
            <p className="text-[12px] font-semibold text-red-600">{pinError}</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand py-3 text-[14.5px] font-bold text-white transition active:scale-[0.99]"
          >
            Entrar
          </button>
        </form>
      </PageShell>
    );
  }

  return (
    <PageShell title="Pedidos del comercio">
      {dbError ? (
        <p className="rounded-2xl border border-line bg-surface p-3.5 text-[12.5px] text-muted">
          ⚠️ {dbError}
        </p>
      ) : null}

      {orders === null && !dbError ? (
        <div className="space-y-2.5" aria-hidden>
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface" />
        </div>
      ) : null}

      {orders !== null && orders.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-center text-[13px] text-muted">
          Todavía no entraron pedidos. Cuando un cliente confirme uno, aparece
          acá solo. 🛵
        </p>
      ) : null}

      <ul className="space-y-3">
        {(orders ?? []).map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onAdvance={() => {
              const action = NEXT_ACTION[order.status];
              if (action) void changeStatus(order, action.next);
            }}
          />
        ))}
      </ul>
    </PageShell>
  );
}

function OrderCard({
  order,
  onAdvance,
}: {
  order: PanelOrder;
  onAdvance: () => void;
}) {
  const mapUrl = order.address ? mapsUrl(order.address) : null;
  const action = NEXT_ACTION[order.status];
  const time = new Date(order.createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="space-y-2.5 rounded-2xl border border-line bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold text-foreground">
            Pedido {order.id}
          </p>
          <p className="text-[11.5px] text-muted">
            {time} · {order.merchantName}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-dark">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <ul className="space-y-1 text-[12.5px] text-foreground">
        {order.items.map((item, index) => (
          <li key={index} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">
              {item.qty}× {item.emoji ? `${item.emoji} ` : ""}
              {item.name}
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatPrice(item.price * item.qty)}
            </span>
          </li>
        ))}
        <li className="flex justify-between gap-2 border-t border-line pt-1.5 font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(order.total)}</span>
        </li>
      </ul>

      {order.address ? (
        <div className="text-[12.5px]">
          <p className="text-muted">
            📍{" "}
            <span className="font-semibold text-foreground">
              {addressLabel(order.address)}
            </span>
          </p>
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block font-semibold text-brand-dark"
            >
              Ver en el mapa
            </a>
          ) : null}
        </div>
      ) : null}

      {action ? (
        <button
          type="button"
          onClick={onAdvance}
          className="w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99]"
        >
          {action.label}
        </button>
      ) : null}
    </li>
  );
}
