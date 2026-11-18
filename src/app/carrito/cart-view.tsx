"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BagIllustration, EmptyState } from "@/components/empty-state";
import { Photo } from "@/components/photo";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import {
  addressLabel,
  mapPreviewUrl,
  mapsUrl,
  readAddress,
  saveAddress,
  type DeliveryAddress,
} from "@/lib/address";
import {
  isValidName,
  isValidPhone,
  readCustomer,
  saveCustomer,
} from "@/lib/customer";
import {
  findMenuItemByKey,
  formatPrice,
  getMerchantBySlug,
} from "@/lib/demo-data";
import { whenLong } from "@/lib/hours";
import { itemPrice } from "@/lib/pricing";
import { useOpenStatus } from "@/lib/use-open-status";
import {
  newOrderId,
  saveOrder,
  type Order,
  type PaymentMethod,
} from "@/lib/orders";
import { merchantWhatsAppUrl } from "@/lib/whatsapp";

export function CartView() {
  const { ready, count } = useCart();
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  /** Aviso si el pedido no se pudo registrar en el servidor. */
  const [syncError, setSyncError] = useState<string | null>(null);

  // Todavía estamos leyendo el carrito guardado en el celular.
  if (!ready) {
    return (
      <div className="min-h-[70dvh] space-y-2.5" aria-hidden>
        {[0, 1].map((row) => (
          <div key={row} className="skeleton h-[4.75rem] rounded-2xl" />
        ))}
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  if (confirmed) {
    return <OrderConfirmation order={confirmed} syncError={syncError} />;
  }

  if (count === 0) {
    return (
      <div className="anim-fade-in">
        <EmptyState
          illustration={<BagIllustration />}
          title="Tu carrito está vacío"
          description="Elegí un comercio y tocá el + de lo que quieras pedir."
          ctaHref="/comercios"
          ctaLabel="Ver comercios"
        />
      </div>
    );
  }

  return (
    <CartForm
      onConfirmed={(order, warning) => {
        setSyncError(warning);
        setConfirmed(order);
      }}
    />
  );
}

/**
 * El carrito con el formulario de entrega y datos. Se monta recién cuando el
 * carrito ya se leyó en el celular (después de hidratar), así que puede
 * arrancar con lo guardado sin desfasar el render del servidor.
 */
function CartForm({
  onConfirmed,
}: {
  onConfirmed: (order: Order, warning: string | null) => void;
}) {
  const { items, subtotal, merchantSlug, changeQty, clear } = useCart();
  const merchant = merchantSlug ? getMerchantBySlug(merchantSlug) : undefined;
  // Abierto o cerrado según la hora real de Argentina (null = todavía no sabemos).
  const openStatus = useOpenStatus(merchant);
  const closed = openStatus !== null && !openStatus.open;

  const [address, setAddress] = useState<DeliveryAddress | null>(() => readAddress());
  const [geoState, setGeoState] = useState<"idle" | "loading" | "denied">("idle");
  const [name, setName] = useState(() => readCustomer()?.name ?? "");
  const [phone, setPhone] = useState(() => readCustomer()?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [sending, setSending] = useState(false);
  /** Mensaje del servidor cuando rechazó el pedido (se muestra en rojo). */
  const [serverError, setServerError] = useState<string | null>(null);
  /** Evita que un doble toque mande el pedido dos veces. */
  const sendingRef = useRef(false);

  // Cada cambio de dirección se guarda, para el próximo pedido.
  useEffect(() => {
    if (address && address.street.trim()) saveAddress(address);
  }, [address]);

  function askLocation() {
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

  const deliveryFee = merchant?.deliveryFeeValue ?? 0;
  const minOrder = merchant?.minOrderValue ?? 0;
  const total = subtotal + deliveryFee;
  const hasStreet = (address?.street.trim().length ?? 0) >= 3;
  const nameOk = isValidName(name);
  const phoneOk = isValidPhone(phone);
  const minOk = subtotal >= minOrder;
  const canConfirm =
    Boolean(merchant) && !closed && hasStreet && nameOk && phoneOk && minOk;

  // Lo primero que falta para poder confirmar.
  let hint: string | null = null;
  if (closed && merchant) {
    hint = `${merchant.name} está cerrado ahora: no podemos tomar el pedido.`;
  } else if (!hasStreet) hint = "Escribí la calle y número para confirmar el pedido.";
  else if (!nameOk) hint = "Escribí tu nombre para confirmar el pedido.";
  else if (!phoneOk)
    hint = "Escribí un teléfono válido (con código de área) para confirmar el pedido.";
  else if (!minOk && merchant) {
    hint = `Te faltan ${formatPrice(minOrder - subtotal)} para llegar al mínimo de ${merchant.name} (${formatPrice(minOrder)}).`;
  }

  async function confirmOrder() {
    if (sendingRef.current || !canConfirm || !address || !merchant) return;
    sendingRef.current = true;
    setSending(true);
    setServerError(null);

    const id = newOrderId();
    const cleanAddress: DeliveryAddress = {
      ...address,
      street: address.street.trim(),
      reference: address.reference?.trim() || undefined,
    };
    const customer = { name: name.trim(), phone: phone.trim() };
    const cleanNotes = notes.trim() || undefined;
    saveCustomer(customer);

    const details = {
      items,
      address: cleanAddress,
      customerName: customer.name,
      customerPhone: customer.phone,
      notes: cleanNotes,
      payment,
      merchantSlug: merchant.slug,
      merchantName: merchant.name,
    };

    /** Plan B: el pedido queda en el celular y se reintenta desde "Mis pedidos". */
    function keepLocally(warning: string) {
      const order = saveOrder({
        id,
        ...details,
        subtotal,
        deliveryFee,
        total,
      });
      clear();
      onConfirmed(order, warning);
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          items: items.map((item) => ({ key: item.key, qty: item.qty })),
          address: cleanAddress,
          customer,
          notes: cleanNotes,
          payment,
        }),
      });

      if (response.status === 400) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setServerError(
          data.error ??
            "No pudimos tomar tu pedido. Revisá los datos y probá de nuevo.",
        );
        return;
      }

      if (response.ok) {
        const data = (await response.json()) as {
          id?: string;
          subtotal: number;
          deliveryFee: number;
          total: number;
        };
        const order = saveOrder({
          id,
          ...details,
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          total: data.total,
          serverId: data.id ?? id,
          status: "recibido",
        });
        clear();
        onConfirmed(order, null);
        return;
      }

      keepLocally(
        response.status === 503
          ? "El comercio todavía no tiene su panel conectado: avisale por WhatsApp para que sepa de tu pedido."
          : "No pudimos mandar el pedido al panel del comercio: avisale por WhatsApp. Lo reintentamos solos desde Mis pedidos.",
      );
    } catch {
      keepLocally(
        "Sin internet: el pedido quedó en tu celular. Avisale al comercio por WhatsApp; lo reintentamos solos cuando vuelva la conexión.",
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <div className="anim-fade-in space-y-5">
      <ul className="space-y-2.5">
        {items.map((item, index) => {
          // La foto y el precio de lista salen del catálogo (no se guardan en el celular).
          const found = findMenuItemByKey(item.key);
          const original = found ? itemPrice(found.item).original : item.price;
          return (
          <li
            key={item.key}
            className="anim-fade-up flex items-center gap-3 rounded-2xl border border-line p-2.5"
            style={{ "--i": index } as React.CSSProperties}
          >
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
              <Photo
                src={found?.item.photo}
                emoji={item.emoji}
                gradient={found?.merchant.gradient}
                sizes="56px"
                emojiClassName="text-xl"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-foreground">
                {item.name}
              </p>
              <p className="truncate text-[11.5px] text-muted">
                {item.merchantName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold tabular-nums text-foreground">
                {formatPrice(item.price * item.qty)}
                {original > item.price ? (
                  <s className="text-[11px] font-normal text-muted">
                    {formatPrice(original * item.qty)}
                  </s>
                ) : null}
              </p>
            </div>
            <QtyStepper
              qty={item.qty}
              itemName={item.name}
              onIncrement={() => changeQty(item.key, 1)}
              onDecrement={() => changeQty(item.key, -1)}
              disableAdd={closed}
            />
          </li>
          );
        })}
      </ul>

      {closed && merchant ? (
        <p
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-[12.5px] font-semibold leading-snug text-amber-800"
        >
          {merchant.name} está cerrado ahora
          {openStatus?.change ? ` · abre ${whenLong(openStatus.change)}` : ""}.
          <span className="mt-0.5 block text-[11.5px] font-normal">
            Tu carrito queda guardado: cuando abra, podés confirmar el pedido.
          </span>
        </p>
      ) : null}

      <AddressCard
        address={address}
        onChange={setAddress}
        geoState={geoState}
        onUseLocation={askLocation}
      />

      <section className="space-y-3 rounded-2xl border border-line bg-white p-3.5">
        <h2 className="text-[13.5px] font-bold text-foreground">Tus datos</h2>

        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Tu nombre
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoComplete="name"
            placeholder="Ej: Lucía Gómez"
            enterKeyHint="next"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Tu teléfono
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={30}
            placeholder="Ej: 3455 123456"
            enterKeyHint="next"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Aclaraciones para el comercio (opcional)
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Ej: sin cebolla, timbre no anda"
            className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand"
          />
        </label>

        <div>
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            ¿Cómo pagás?
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["efectivo", "Efectivo"],
                ["transferencia", "Transferencia"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={payment === value}
                onClick={() => setPayment(value)}
                className={`rounded-xl border py-2.5 text-[13px] font-semibold transition active:scale-[0.99] ${
                  payment === value
                    ? "border-brand bg-brand-soft text-brand-dark"
                    : "border-line bg-white text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

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
        {serverError ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-[12.5px] font-semibold text-red-700"
          >
            ⚠️ {serverError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void confirmOrder()}
          disabled={!canConfirm || sending}
          className="w-full rounded-2xl bg-brand py-3.5 text-[14.5px] font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
        >
          {sending
            ? "Enviando pedido…"
            : `Confirmar pedido · ${formatPrice(total)}`}
        </button>
        {hint ? (
          <p className="text-center text-[11.5px] text-muted">{hint}</p>
        ) : null}
        <button
          type="button"
          onClick={clear}
          disabled={sending}
          className="w-full py-2 text-[12px] font-medium text-muted hover:text-foreground disabled:opacity-50"
        >
          Vaciar carrito
        </button>
      </div>

      <p className="pb-2 text-center text-[11px] leading-relaxed text-muted">
        {payment === "efectivo"
          ? "Pagás en efectivo al recibir."
          : "Te pasamos el alias para transferir cuando confirmemos el pedido."}
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
    <div className="anim-fade-in pb-4 text-center">
      <span
        className="anim-pop mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-4xl"
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

      <p className="mt-3 text-[12px] text-muted">
        {order.payment === "transferencia"
          ? "Te pasamos el alias para transferir cuando confirmemos el pedido."
          : "Pagás en efectivo al recibir."}
      </p>

      <div className="mt-5 space-y-2">
        {order.serverId ? (
          <p className="text-[11.5px] font-semibold text-brand-dark">
            ✅ El comercio ya ve tu pedido en su panel.
          </p>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] font-semibold text-amber-800">
            ⚠️{" "}
            {syncError ??
              "El pedido quedó en tu celular y todavía no le llegó al comercio: avisale por WhatsApp."}
          </p>
        )}
        <Link
          href={`/pedidos/${order.id}`}
          className="block rounded-2xl bg-brand py-3 text-[14px] font-bold text-white"
        >
          Seguir mi pedido
        </Link>
        {whatsappUrl ? (
          <>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-brand bg-brand-soft py-3 text-[14px] font-bold text-brand-dark"
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
