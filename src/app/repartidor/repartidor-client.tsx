"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { addressLabel, mapsUrl, type DeliveryAddress } from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

/**
 * Panel del repartidor: ve los pedidos listos para salir y, cuando aprieta
 * "Salí en camino", comparte su ubicación GPS con el cliente cada 5 segundos.
 */

type PanelOrder = {
  id: string;
  merchantName: string;
  items: { name: string; qty: number; price: number; emoji?: string }[];
  address: DeliveryAddress | null;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

const PIN_KEY = "altoque.courier-pin.v1";

/** Los pedidos que le interesan al repartidor: todo menos los entregados. */
function isActive(status: OrderStatus): boolean {
  return status !== "entregado";
}

export function RepartidorClient() {
  const [pin, setPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PanelOrder[] | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  /** Pedido que está entregando ahora, con el GPS compartido. */
  const [activeId, setActiveId] = useState<string | null>(null);
  const [geoState, setGeoState] = useState<"off" | "on" | "error">("off");
  const watchRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(PIN_KEY);
      if (saved) setPin(saved);
    } catch {
      // Modo incógnito: se pide el PIN cada vez.
    }
  }, []);

  const loadOrders = useCallback(async (currentPin: string) => {
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
  }, []);

  useEffect(() => {
    if (!pin) return;
    void loadOrders(pin);
    const timer = setInterval(() => void loadOrders(pin), 5000);
    return () => clearInterval(timer);
  }, [pin, loadOrders]);

  // Limpia el GPS si se cierra la pantalla.
  useEffect(
    () => () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    },
    [],
  );

  function enterPin(event: React.FormEvent) {
    event.preventDefault();
    const clean = pinInput.trim();
    if (!clean) return;
    setPinError(null);
    setPin(clean);
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

  function startDelivery(order: PanelOrder) {
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setActiveId(order.id);
    activeIdRef.current = order.id;
    setGeoState("on");
    void changeStatus(order, "en camino");

    // Envía la posición actual de inmediato, no solo cuando el GPS se mueva.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const id = activeIdRef.current;
        if (!id) return;
        void fetch(`/api/orders/${encodeURIComponent(id)}/position`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-altoque-pin": pin ?? "",
          },
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        }).catch(() => {});
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, timeout: 15000 },
    );

    // Detiene el envío anterior, si había.
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const id = activeIdRef.current;
        if (!id) return;
        void fetch(`/api/orders/${encodeURIComponent(id)}/position`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-altoque-pin": pin ?? "",
          },
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        }).catch(() => {
          // El siguiente tick del GPS reintenta con la posición más nueva.
        });
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }

  function finishDelivery(order: PanelOrder) {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    activeIdRef.current = null;
    setActiveId(null);
    setGeoState("off");
    void changeStatus(order, "entregado");
  }

  if (!pin) {
    return (
      <PageShell title="Panel del repartidor">
        <form onSubmit={enterPin} className="space-y-3 pt-6">
          <p className="text-[13px] text-muted">
            Ingresá tu PIN de repartidor para ver los pedidos a entregar.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={pinInput}
            onChange={(event) => setPinInput(event.target.value)}
            placeholder="PIN"
            aria-label="PIN del repartidor"
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

  const visible = (orders ?? []).filter((order) => isActive(order.status));

  return (
    <PageShell title="Pedidos a entregar">
      {geoState === "on" ? (
        <p className="mb-3 rounded-2xl bg-brand-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-dark">
          📡 Estás compartiendo tu ubicación con el cliente.
        </p>
      ) : null}
      {geoState === "error" ? (
        <p className="mb-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[12.5px] text-muted">
          No pudimos leer tu ubicación: revisá que el GPS del celular esté
          activado y el permiso concedido.
        </p>
      ) : null}
      {dbError ? (
        <p className="rounded-2xl border border-line bg-surface p-3.5 text-[12.5px] text-muted">
          ⚠️ {dbError}
        </p>
      ) : null}

      {orders === null && !dbError ? (
        <div className="space-y-2.5" aria-hidden>
          <div className="h-24 animate-pulse rounded-2xl bg-surface" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        </div>
      ) : null}

      {orders !== null && visible.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-center text-[13px] text-muted">
          No hay pedidos pendientes. Cuando el dueño confirme uno, aparece acá.
        </p>
      ) : null}

      <ul className="space-y-3">
        {visible.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            active={order.id === activeId}
            onStart={() => startDelivery(order)}
            onFinish={() => finishDelivery(order)}
          />
        ))}
      </ul>
    </PageShell>
  );
}

function OrderCard({
  order,
  active,
  onStart,
  onFinish,
}: {
  order: PanelOrder;
  active: boolean;
  onStart: () => void;
  onFinish: () => void;
}) {
  const mapUrl = order.address ? mapsUrl(order.address) : null;

  return (
    <li className="space-y-2.5 rounded-2xl border border-line bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold text-foreground">
            Pedido {order.id}
          </p>
          <p className="text-[11.5px] text-muted">
            Retirá en {order.merchantName}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-dark">
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <ul className="space-y-1 text-[12.5px] text-foreground">
        {order.items.map((item, index) => (
          <li key={index} className="truncate">
            {item.qty}× {item.emoji ? `${item.emoji} ` : ""}
            {item.name}
          </li>
        ))}
        <li className="flex justify-between gap-2 border-t border-line pt-1.5 font-bold">
          <span>Total a cobrar</span>
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
              Abrir en el mapa
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={active}
          className="flex-1 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {active ? "🛵 En camino…" : "🛵 Salí en camino"}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-xl border border-brand bg-brand-soft py-2.5 text-[13px] font-bold text-brand-dark transition active:scale-[0.99]"
        >
          ✅ Entregado
        </button>
      </div>
    </li>
  );
}
