"use client";

import { useEffect, useRef, useState } from "react";
import { MotoIcon } from "@/components/moto-icon";
import { PageShell } from "@/components/page-shell";
import { addressLabel, mapsUrl, type DeliveryAddress } from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { useStored, writeStored } from "@/lib/local-store";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { telUrl, whatsappUrl } from "@/lib/phone";
import { usePolling } from "@/lib/use-polling";

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
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  payment?: "efectivo" | "transferencia" | null;
};

const PIN_KEY = "altoque.courier-pin.v1";

/** Al repartidor le sirven los pedidos que están por salir o ya salieron. */
function isActive(status: OrderStatus): boolean {
  return status === "preparando" || status === "en camino";
}

const GEO_WARNING =
  "No pudimos leer tu ubicación: revisá que el GPS del celular esté activado y el permiso concedido. La entrega funciona igual, pero el cliente no te ve en el mapa.";

export function RepartidorClient() {
  const pin = useStored(PIN_KEY, "session");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PanelOrder[] | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  /** Pedido para el que este celular está compartiendo el GPS ahora. */
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const sharingIdRef = useRef<string | null>(null);
  const pinRef = useRef<string | null>(null);

  useEffect(() => {
    pinRef.current = pin ?? null;
  }, [pin]);

  // Limpia el GPS si se cierra la pantalla.
  useEffect(
    () => () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    },
    [],
  );

  /** Corta el envío de ubicación (si lo había). */
  function stopSharing() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    sharingIdRef.current = null;
    setSharingId(null);
  }

  async function loadOrders(currentPin: string) {
    try {
      const response = await fetch("/api/orders", {
        headers: { "x-altoque-pin": currentPin },
        cache: "no-store",
      });
      if (response.status === 401) {
        setPinError("El PIN no es correcto.");
        writeStored(PIN_KEY, null, "session");
        setOrders(null);
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

      // Si el pedido que estaba compartiendo ya no está en camino, dejamos de compartir.
      const sharing = sharingIdRef.current;
      if (
        sharing &&
        !data.orders.some(
          (order) => order.id === sharing && order.status === "en camino",
        )
      ) {
        stopSharing();
      }
    } catch {
      setDbError("Sin conexión con el servidor. Revisá tu internet.");
    }
  }

  usePolling(() => {
    if (pin) void loadOrders(pin);
  }, 5000, Boolean(pin));

  function enterPin(event: React.FormEvent) {
    event.preventDefault();
    const clean = pinInput.trim();
    if (!clean) return;
    setPinError(null);
    writeStored(PIN_KEY, clean, "session");
  }

  function leave() {
    stopSharing();
    writeStored(PIN_KEY, null, "session");
    setOrders(null);
    setPinInput("");
    setActionError(null);
    setDbError(null);
    setGeoWarning(null);
  }

  /** Cambia el estado en el servidor. Devuelve true si salió bien. */
  async function changeStatus(order: PanelOrder, next: OrderStatus): Promise<boolean> {
    setBusyId(order.id);
    setActionError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-altoque-pin": pin ?? "",
        },
        body: JSON.stringify({ status: next }),
      });
      if (response.ok) {
        void loadOrders(pin ?? "");
        return true;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 401) {
        setActionError("El PIN no es correcto: volvé a entrar con tu PIN.");
      } else if (response.status === 404) {
        setActionError(`El pedido ${order.id} no se encontró en el servidor.`);
      } else if (response.status === 409) {
        // Alguien más ya lo cambió: mostramos el motivo y traemos lo último.
        setActionError(data.error ?? "El pedido ya cambió de estado.");
        void loadOrders(pin ?? "");
      } else if (response.status === 503) {
        setActionError(data.error ?? "Falta conectar la base de datos.");
      } else {
        setActionError(
          data.error ?? `No se pudo cambiar el estado (error ${response.status}).`,
        );
      }
      return false;
    } catch {
      setActionError("Sin conexión: revisá tu internet y probá de nuevo.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  /** Manda una posición al servidor. Si el pedido ya terminó, deja de compartir. */
  function postPosition(id: string, position: GeolocationPosition) {
    fetch(`/api/orders/${encodeURIComponent(id)}/position`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-altoque-pin": pinRef.current ?? "",
      },
      body: JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
    })
      .then((response) => {
        if (
          (response.status === 409 || response.status === 404) &&
          sharingIdRef.current === id
        ) {
          stopSharing();
        }
      })
      .catch(() => {
        // El siguiente tick del GPS reintenta con la posición más nueva.
      });
  }

  /** Empieza a mandar la ubicación de este celular para el pedido. */
  function startSharing(id: string) {
    if (!navigator.geolocation) {
      setGeoWarning(GEO_WARNING);
      return;
    }
    // Corta el envío anterior, si había.
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);

    setGeoWarning(null);
    sharingIdRef.current = id;
    setSharingId(id);

    const onError = () => {
      stopSharing();
      setGeoWarning(GEO_WARNING);
    };

    // Posición de inmediato, sin esperar a que el GPS se mueva.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (sharingIdRef.current === id) postPosition(id, position);
      },
      onError,
      { enableHighAccuracy: true, timeout: 15000 },
    );

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (sharingIdRef.current === id) postPosition(id, position);
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }

  async function startDelivery(order: PanelOrder) {
    const ok = await changeStatus(order, "en camino");
    // El GPS arranca solo si el cambio salió bien; si falla, no queda "compartiendo".
    if (ok) startSharing(order.id);
  }

  async function finishDelivery(order: PanelOrder) {
    const ok = await changeStatus(order, "entregado");
    if (ok && sharingIdRef.current === order.id) stopSharing();
  }

  if (pin === undefined) {
    return (
      <PageShell title="Panel del repartidor">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" aria-hidden />
      </PageShell>
    );
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
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={leave}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted hover:text-foreground"
        >
          Salir
        </button>
      </div>

      {sharingId ? (
        <p className="mb-3 rounded-2xl bg-brand-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-dark">
          📡 Estás compartiendo tu ubicación con el cliente.
        </p>
      ) : null}
      {geoWarning ? (
        <p className="mb-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[12.5px] text-muted">
          {geoWarning}
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
          No hay pedidos para entregar. Cuando el dueño tenga uno en preparación, aparece acá.
        </p>
      ) : null}

      <ul className="space-y-3">
        {visible.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            sharing={order.id === sharingId}
            busy={order.id === busyId}
            onStart={() => void startDelivery(order)}
            onShare={() => startSharing(order.id)}
            onFinish={() => void finishDelivery(order)}
          />
        ))}
      </ul>
      {actionError ? (
        <p
          role="alert"
          className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-[12.5px] font-semibold text-red-700"
        >
          ⚠️ {actionError}
        </p>
      ) : null}
    </PageShell>
  );
}

function OrderCard({
  order,
  sharing,
  busy,
  onStart,
  onShare,
  onFinish,
}: {
  order: PanelOrder;
  sharing: boolean;
  busy: boolean;
  onStart: () => void;
  onShare: () => void;
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

      {order.customerName || order.customerPhone ? (
        <div className="space-y-1.5 text-[12.5px]">
          {order.customerName ? (
            <p className="text-muted">
              👤{" "}
              <span className="font-semibold text-foreground">
                {order.customerName}
              </span>
            </p>
          ) : null}
          {order.customerPhone ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular-nums text-muted">
                📞 {order.customerPhone}
              </span>
              <a
                href={telUrl(order.customerPhone)}
                className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-foreground"
              >
                Llamar
              </a>
              <a
                href={whatsappUrl(order.customerPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-dark"
              >
                WhatsApp
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {order.notes ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[12.5px] font-semibold text-amber-800">
          📝 {order.notes}
        </p>
      ) : null}

      <ul className="space-y-1 text-[12.5px] text-foreground">
        {order.items.map((item, index) => (
          <li key={index} className="truncate">
            {item.qty}× {item.emoji ? `${item.emoji} ` : ""}
            {item.name}
          </li>
        ))}
        <li className="flex justify-between gap-2 border-t border-line pt-1.5 font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(order.total)}</span>
        </li>
      </ul>

      {order.payment === "transferencia" ? (
        <p className="rounded-xl bg-surface p-2.5 text-[12.5px] font-semibold text-foreground">
          💳 Pagó por transferencia (confirmá con el comercio)
        </p>
      ) : (
        <p className="rounded-xl bg-brand-soft p-2.5 text-[12.5px] font-bold text-brand-dark">
          💵 Cobrar {formatPrice(order.total)} en efectivo
        </p>
      )}

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

      {order.status === "preparando" ? (
        <button
          type="button"
          onClick={onStart}
          disabled={busy}
          className="w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? (
            "Guardando…"
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="grid place-items-center rounded-full bg-white px-2 py-0.5">
                <MotoIcon className="h-4 w-auto" />
              </span>
              Salí en camino
            </span>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          {!sharing ? (
            <button
              type="button"
              onClick={onShare}
              disabled={busy}
              className="w-full rounded-xl border border-brand bg-brand-soft py-2.5 text-[13px] font-bold text-brand-dark transition active:scale-[0.99] disabled:opacity-50"
            >
              📡 Compartir mi ubicación
            </button>
          ) : null}
          <button
            type="button"
            onClick={onFinish}
            disabled={busy}
            className="w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "Guardando…" : "✅ Entregado"}
          </button>
        </div>
      )}
    </li>
  );
}
