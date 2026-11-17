"use client";

import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import {
  addressLabel,
  mapsUrl,
  type DeliveryAddress,
} from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { useStored, writeStored } from "@/lib/local-store";
import { isFinalStatus, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { telUrl, whatsappUrl } from "@/lib/phone";
import { usePolling } from "@/lib/use-polling";

/**
 * Panel del dueño: ve los pedidos que entran y los va pasando de estado.
 * La lista se refresca sola cada 5 segundos mientras la pantalla está a la vista.
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
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  payment?: "efectivo" | "transferencia" | null;
};

const PIN_KEY = "altoque.owner-pin.v1";
const SOUND_KEY = "altoque.owner-sound.v1";

/** Botón siguiente según el estado actual del pedido. */
const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  recibido: { label: "🍳 Empezar a preparar", next: "preparando" },
  preparando: { label: "🛵 Salida en camino", next: "en camino" },
  "en camino": { label: "✅ Marcar entregado", next: "entregado" },
};

let audioContext: AudioContext | null = null;

/** Pitido corto con Web Audio (sin archivos). Si el navegador lo bloquea, no pasa nada. */
function playBeep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    audioContext ??= new Ctx();
    const ctx = audioContext;
    void ctx.resume().catch(() => {});
    const start = ctx.currentTime;
    [880, 1175].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const from = start + index * 0.2;
      gain.gain.setValueAtTime(0.0001, from);
      gain.gain.exponentialRampToValueAtTime(0.3, from + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, from + 0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(from);
      oscillator.stop(from + 0.2);
    });
  } catch {
    // Audio bloqueado o no disponible: el aviso visual alcanza.
  }
}

export function DuenoClient() {
  const pin = useStored(PIN_KEY, "session");
  const soundOn = useStored(SOUND_KEY) === "on";
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PanelOrder[] | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  /** Pedido cuyo cambio de estado está en vuelo (para deshabilitar su botón). */
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Mensaje de error del último cambio de estado que falló. */
  const [actionError, setActionError] = useState<string | null>(null);
  const [view, setView] = useState<"curso" | "terminados">("curso");
  /** Pedidos nuevos resaltados un rato. */
  const [highlighted, setHighlighted] = useState<string[]>([]);
  /** Ids ya vistos: null hasta la primera carga, que no suena. */
  const knownIdsRef = useRef<Set<string> | null>(null);
  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  async function loadOrders(currentPin: string) {
    try {
      const response = await fetch("/api/orders", {
        headers: { "x-altoque-pin": currentPin },
        cache: "no-store",
      });
      if (response.status === 401) {
        setPinError("El PIN no es correcto.");
        writeStored(PIN_KEY, null, "session");
        knownIdsRef.current = null;
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

      // Aviso de pedidos nuevos (la primera carga no cuenta).
      const known = knownIdsRef.current;
      if (known) {
        const fresh = data.orders
          .filter((order) => order.status === "recibido" && !known.has(order.id))
          .map((order) => order.id);
        if (fresh.length > 0) {
          if (soundOnRef.current) playBeep();
          setHighlighted((current) => [...current, ...fresh]);
          setTimeout(() => {
            setHighlighted((current) => current.filter((id) => !fresh.includes(id)));
          }, 6000);
        }
      }
      knownIdsRef.current = new Set(data.orders.map((order) => order.id));
      setOrders(data.orders);
    } catch {
      setDbError("Sin conexión con el servidor. Revisá tu internet.");
    }
  }

  // Carga inicial + refresco cada 5 segundos (pausado con la pestaña oculta).
  usePolling(() => {
    if (pin) void loadOrders(pin);
  }, 5000, Boolean(pin));

  function enterPin(event: React.FormEvent) {
    event.preventDefault();
    const clean = pinInput.trim();
    if (!clean) return;
    setPinError(null);
    // La validación real la hace el primer pedido al servidor.
    writeStored(PIN_KEY, clean, "session");
  }

  function leave() {
    writeStored(PIN_KEY, null, "session");
    knownIdsRef.current = null;
    setOrders(null);
    setPinInput("");
    setActionError(null);
    setDbError(null);
  }

  function toggleSound() {
    if (soundOn) {
      writeStored(SOUND_KEY, "off");
    } else {
      writeStored(SOUND_KEY, "on");
      // Se toca dentro del gesto del usuario: así el navegador deja sonar después.
      playBeep();
    }
  }

  async function changeStatus(order: PanelOrder, next: OrderStatus) {
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
      } else {
        // Aviso visible: nunca más un botón que "no hace nada".
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (response.status === 401) {
          setActionError("El PIN no es correcto: volvé a entrar con el PIN del comercio.");
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
      }
    } catch {
      setActionError("Sin conexión: revisá tu internet y probá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  // Todavía no sabemos si hay un PIN guardado en esta pestaña.
  if (pin === undefined) {
    return (
      <PageShell title="Panel del dueño">
        <div className="h-28 animate-pulse rounded-2xl bg-surface" aria-hidden />
      </PageShell>
    );
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

  const inProgress = (orders ?? []).filter((order) => !isFinalStatus(order.status));
  const finished = (orders ?? [])
    .filter((order) => isFinalStatus(order.status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const shown = view === "curso" ? inProgress : finished;

  return (
    <PageShell title="Pedidos del comercio">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-foreground"
        >
          {soundOn ? "🔔 Sonido activado" : "🔕 Sonido desactivado"}
        </button>
        <button
          type="button"
          onClick={leave}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted hover:text-foreground"
        >
          Salir
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Pedidos"
        className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
      >
        {(
          [
            ["curso", `En curso (${inProgress.length})`],
            ["terminados", "Terminados"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={`rounded-lg py-2 text-[12.5px] font-semibold transition ${
              view === value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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

      {orders !== null && shown.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-center text-[13px] text-muted">
          {view === "curso"
            ? "No hay pedidos en curso. Cuando un cliente confirme uno, aparece acá solo. 🛵"
            : "Todavía no hay pedidos terminados."}
        </p>
      ) : null}

      <ul className="space-y-3">
        {shown.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={order.id === busyId}
            highlighted={highlighted.includes(order.id)}
            onAdvance={() => {
              const action = NEXT_ACTION[order.status];
              if (action) void changeStatus(order, action.next);
            }}
            onCancel={() => void changeStatus(order, "cancelado")}
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
  busy,
  highlighted,
  onAdvance,
  onCancel,
}: {
  order: PanelOrder;
  busy: boolean;
  highlighted: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const mapUrl = order.address ? mapsUrl(order.address) : null;
  const action = NEXT_ACTION[order.status];
  const final = isFinalStatus(order.status);
  const time = new Date(order.createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li
      className={`space-y-2.5 rounded-2xl border bg-white p-3.5 transition ${
        highlighted ? "border-brand ring-2 ring-brand/40" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold text-foreground">
            Pedido {order.id}
          </p>
          <p className="text-[11.5px] text-muted">
            {time} · {order.merchantName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            order.status === "cancelado"
              ? "bg-red-50 text-red-700"
              : "bg-brand-soft text-brand-dark"
          }`}
        >
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
        {order.payment ? (
          <li className="flex justify-between gap-2 text-[12px] text-muted">
            <span>Pago</span>
            <span className="font-semibold text-foreground">
              {order.payment === "transferencia"
                ? "Transferencia"
                : "Efectivo al recibir"}
            </span>
          </li>
        ) : null}
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
          disabled={busy}
          className="w-full rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "Guardando…" : action.label}
        </button>
      ) : null}

      {!final ? (
        confirmingCancel ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2">
            <span className="flex-1 text-[12.5px] font-semibold text-red-700">
              ¿Seguro?
            </span>
            <button
              type="button"
              onClick={() => {
                setConfirmingCancel(false);
                onCancel();
              }}
              disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-50"
            >
              Cancelar pedido
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-foreground"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            disabled={busy}
            className="w-full rounded-xl border border-line py-2 text-[12.5px] font-semibold text-red-700 disabled:opacity-50"
          >
            Cancelar pedido
          </button>
        )
      ) : null}
    </li>
  );
}
