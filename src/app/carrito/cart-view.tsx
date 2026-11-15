"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { appConfig } from "@/lib/config";
import {
  addressLabel,
  mapPreviewUrl,
  mapsUrl,
  readAddress,
  saveAddress,
  type DeliveryAddress,
} from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import { saveOrder, type Order } from "@/lib/orders";
import { merchantWhatsAppUrl } from "@/lib/whatsapp";
import { markOrderServer, markOrderStatus } from "@/lib/orders";

export function CartView() {
  const { items, ready, subtotal, count, changeQty, clear } = useCart();
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  /** Aviso si el pedido no se pudo registrar en el servidor. */
  const [syncError, setSyncError] = useState<string | null>(null);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "denied">("idle");

  // Al abrir el carrito, recuperamos la dirección guardada en el celular.
  useEffect(() => {
    const saved = readAddress();
    if (saved) setAddress(saved);
  }, []);

  // Cada cambio de dirección se guarda, para el próximo pedido.
  useEffect(() => {
    if (address && address.street.trim()) saveAddress(address);
  }, [address]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddress((current) => ({
          ...(current ?? { street: "" }),
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        }));
        setGeoState("idle");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Todavía estamos leyendo el carrito guardado en el celular.
  if (!ready) {
    return (
      <div className="space-y-2.5" aria-hidden>
        {[0, 1].map((row) => (
          <div
            key={row}
            className="h-20 animate-pulse rounded-2xl bg-surface"
          />
        ))}
      </div>
    );
  }

  if (confirmed) {
    return <OrderConfirmation order={confirmed} syncError={syncError} />;
  }

  if (count === 0) {
    return (
      <div>
        <EmptyState
          emoji="🛒"
          title="Tu carrito está vacío"
          description="Elegí un comercio y tocá el + de lo que quieras pedir."
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

  const deliveryFee = appConfig.deliveryFeeValue;
  const total = subtotal + deliveryFee;
  const hasStreet = (address?.street.trim().length ?? 0) >= 3;

  function confirmOrder() {
    if (!address || !hasStreet) return;
    const order = saveOrder({
      items,
      subtotal,
      deliveryFee,
      total,
      address: {
        ...address,
        street: address.street.trim(),
        reference: address.reference?.trim() || undefined,
      },
    });
    clear();
    setConfirmed(order);
    void syncOrder(order);
  }

  /** Manda el pedido al servidor para que lo vean el dueño y el repartidor. */
  async function syncOrder(order: Order) {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          items: order.items.map((item) => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
            emoji: item.emoji,
            merchantName: item.merchantName,
            merchantSlug: item.merchantSlug,
          })),
          address: order.address ?? null,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
        }),
      });
      if (!response.ok) {
        setSyncError(
          response.status === 503
            ? "El comercio todavía no tiene su panel conectado: avisale por WhatsApp igual."
            : "No se pudo registrar el pedido en el panel del comercio. Avisale por WhatsApp igual.",
        );
        return;
      }
      const data = (await response.json()) as { id?: string };
      const serverId = data.id ?? order.id;
      markOrderServer(order.id, serverId);
      markOrderStatus(order.id, "recibido");
      setConfirmed((current) =>
        current && current.id === order.id ? { ...current, serverId } : current,
      );
    } catch {
      setSyncError(
        "Sin internet: el pedido quedó en tu celular y se puede avisar por WhatsApp igual.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-3 rounded-2xl border border-line p-2.5"
          >
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface text-xl"
              aria-hidden
            >
              {item.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-foreground">
                {item.name}
              </p>
              <p className="truncate text-[11.5px] text-muted">
                {item.merchantName}
              </p>
              <p className="mt-0.5 text-[12.5px] font-semibold tabular-nums text-foreground">
                {formatPrice(item.price * item.qty)}
              </p>
            </div>
            <QtyStepper
              qty={item.qty}
              itemName={item.name}
              onIncrement={() => changeQty(item.key, 1)}
              onDecrement={() => changeQty(item.key, -1)}
            />
          </li>
        ))}
      </ul>

      <AddressCard
        address={address}
        onChange={setAddress}
        geoState={geoState}
        onUseLocation={useMyLocation}
      />

      <section className="space-y-1.5 rounded-2xl border border-line bg-surface p-3.5 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums text-foreground">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Envío</span>
          <span className="tabular-nums text-foreground">
            {formatPrice(deliveryFee)}
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-[14px] font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>
      </section>

      <div className="space-y-2">
        <button
          type="button"
          onClick={confirmOrder}
          disabled={!hasStreet}
          className="w-full rounded-2xl bg-brand py-3.5 text-[14.5px] font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
        >
          Confirmar pedido · {formatPrice(total)}
        </button>
        {!hasStreet ? (
          <p className="text-center text-[11.5px] text-muted">
            Escribí la calle y número para confirmar el pedido.
          </p>
        ) : null}
        <button
          type="button"
          onClick={clear}
          className="w-full py-2 text-[12px] font-medium text-muted hover:text-foreground"
        >
          Vaciar carrito
        </button>
      </div>

      <p className="pb-2 text-center text-[11px] leading-relaxed text-muted">
        El pago lo coordinás al recibir. Mercado Pago llega en la próxima etapa.
      </p>
    </div>
  );
}

function AddressCard({
  address,
  onChange,
  geoState,
  onUseLocation,
}: {
  address: DeliveryAddress | null;
  onChange: (address: DeliveryAddress) => void;
  geoState: "idle" | "loading" | "denied";
  onUseLocation: () => void;
}) {
  const hasCoords = typeof address?.lat === "number" && typeof address?.lng === "number";
  const preview = address ? mapPreviewUrl(address) : null;

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-white p-3.5">
      <h2 className="text-[13.5px] font-bold text-foreground">
        ¿Dónde lo entregamos?
      </h2>

      <label className="block">
        <span className="mb-1 block text-[11.5px] font-semibold text-muted">
          Calle y número
        </span>
        <input
          type="text"
          value={address?.street ?? ""}
          onChange={(event) =>
            onChange({
              ...(address ?? { street: "" }),
              street: event.target.value,
            })
          }
          placeholder="Ej: Urquiza 1234"
          enterKeyHint="done"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11.5px] font-semibold text-muted">
          Referencia (opcional)
        </span>
        <input
          type="text"
          value={address?.reference ?? ""}
          onChange={(event) =>
            onChange({
              ...(address ?? { street: "" }),
              reference: event.target.value,
            })
          }
          placeholder="Ej: portón verde, entre calles"
          enterKeyHint="done"
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand"
        />
      </label>

      <div>
        <button
          type="button"
          onClick={onUseLocation}
          disabled={geoState === "loading"}
          className="w-full rounded-xl border border-brand bg-brand-soft py-2.5 text-[13px] font-semibold text-brand-dark transition active:scale-[0.99] disabled:opacity-50"
        >
          {geoState === "loading"
            ? "Buscando tu ubicación…"
            : hasCoords
              ? "📍 Actualizar mi ubicación"
              : "📍 Usar mi ubicación actual"}
        </button>
        {geoState === "denied" ? (
          <p className="mt-1.5 text-[11.5px] text-muted">
            No pudimos usar tu ubicación: escribí la dirección igual y listo.
          </p>
        ) : null}
      </div>

      {preview ? (
        <div className="space-y-1.5">
          <iframe
            title="Ubicación de entrega en el mapa"
            src={preview}
            loading="lazy"
            className="h-40 w-full rounded-xl border border-line"
          />
          <p className="flex items-center justify-between text-[11.5px] text-muted">
            <span>📍 {addressLabel(address as DeliveryAddress)}</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  street: address?.street ?? "",
                  reference: address?.reference,
                })
              }
              className="font-semibold text-brand-dark"
            >
              Quitar ubicación
            </button>
          </p>
        </div>
      ) : null}
    </section>
  );
}

function OrderConfirmation({
  order,
  syncError,
}: {
  order: Order;
  syncError: string | null;
}) {
  const whatsappUrl = merchantWhatsAppUrl(order);
  const mapUrl = order.address ? mapsUrl(order.address) : null;

  return (
    <div className="pb-4 text-center">
      <span
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-4xl"
        aria-hidden
      >
        🎉
      </span>
      <h2 className="mt-4 text-[17px] font-bold text-foreground">
        ¡Pedido confirmado!
      </h2>
      <p className="mt-1 text-[12.5px] text-muted">
        Tu número de pedido es{" "}
        <strong className="font-semibold text-foreground">{order.id}</strong>
      </p>

      <ul className="mt-5 space-y-1.5 rounded-2xl border border-line bg-surface p-3.5 text-left text-[12.5px]">
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
        <li className="flex justify-between border-t border-line pt-2 text-[13.5px] font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(order.total)}</span>
        </li>
      </ul>

      {order.address ? (
        <div className="mt-3 text-[12.5px]">
          <p className="text-muted">
            📍 Entrega:{" "}
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

      <div className="mt-5 space-y-2">
        {whatsappUrl ? (
          <>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl bg-brand py-3 text-[14px] font-bold text-white"
            >
              Avisar al comercio por WhatsApp
            </a>
            <p className="text-[11.5px] leading-relaxed text-muted">
              Se abre WhatsApp con el pedido ya escrito: solo falta que toques
              el botón de enviar.
            </p>
          </>
        ) : (
          <p className="text-[11.5px] leading-relaxed text-muted">
            Esto es una prueba: el pedido quedó guardado en tu celular y
            todavía no le llega al comercio.
          </p>
        )}
        {order.serverId ? (
          <p className="text-[11.5px] font-semibold text-brand-dark">
            ✅ El comercio ya ve tu pedido en su panel.
          </p>
        ) : syncError ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] font-semibold text-amber-800">
            ⚠️ {syncError}
          </p>
        ) : (
          <p className="text-[11.5px] text-muted">
            Enviando tu pedido al panel del comercio…
          </p>
        )}
        <Link
          href="/pedidos"
          className="block rounded-2xl border border-line py-3 text-[14px] font-semibold text-foreground"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/"
          className="block rounded-2xl py-2 text-[12px] font-medium text-muted"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
