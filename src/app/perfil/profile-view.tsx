"use client";

import Link from "next/link";
import type { DeliveryAddress } from "@/lib/address";
import { appConfig } from "@/lib/config";
import type { Customer } from "@/lib/customer";
import { isValidPhone } from "@/lib/customer";
import { useStored, writeStored } from "@/lib/local-store";
import { ChevronRightIcon } from "@/components/icons";
import { ClearOrdersButton } from "./clear-orders-button";

/**
 * Perfil del cliente: sus datos y su dirección, que se usan para completar
 * solos los próximos pedidos. Todo vive en este celular (no hay cuentas).
 * Lo guardado es la única fuente de verdad: cada tecla se guarda al toque,
 * así el carrito ya lo encuentra listo.
 */

const CUSTOMER_KEY = "altoque.customer.v1";
const ADDRESS_KEY = "altoque.address.v1";

function parse<T>(raw: string | null | undefined): Partial<T> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null ? (value as Partial<T>) : {};
  } catch {
    return {};
  }
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[16px] text-foreground outline-none focus:border-brand";

export function ProfileView() {
  const customerRaw = useStored(CUSTOMER_KEY);
  const addressRaw = useStored(ADDRESS_KEY);
  /** Hasta leer lo guardado mostramos los campos vacíos y bloqueados. */
  const ready = customerRaw !== undefined && addressRaw !== undefined;

  const customer = parse<Customer>(customerRaw);
  const address = parse<DeliveryAddress>(addressRaw);
  const name = typeof customer.name === "string" ? customer.name : "";
  const phone = typeof customer.phone === "string" ? customer.phone : "";
  const street = typeof address.street === "string" ? address.street : "";
  const reference = typeof address.reference === "string" ? address.reference : "";
  const hasPin = typeof address.lat === "number" && typeof address.lng === "number";

  function saveCustomer(patch: Partial<Customer>) {
    writeStored(CUSTOMER_KEY, JSON.stringify({ name, phone, ...patch }));
  }

  function saveAddress(patch: Partial<DeliveryAddress>) {
    writeStored(ADDRESS_KEY, JSON.stringify({ ...address, street, ...patch }));
  }

  function removePin() {
    writeStored(ADDRESS_KEY, JSON.stringify({ street, reference: reference || undefined }));
  }

  const helpUrl = `https://wa.me/${appConfig.whatsapp}?text=${encodeURIComponent(
    `Hola, necesito ayuda con ${appConfig.name}.`,
  )}`;

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-[14px] font-bold text-foreground">Tus datos</h2>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Tu nombre
          </span>
          <input
            type="text"
            value={name}
            disabled={!ready}
            onChange={(event) => saveCustomer({ name: event.target.value })}
            placeholder="Ej: Lucía Gómez"
            maxLength={80}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Tu teléfono
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            disabled={!ready}
            onChange={(event) => saveCustomer({ phone: event.target.value })}
            placeholder="Ej: 3455 123456"
            maxLength={30}
            autoComplete="tel"
            className={inputClass}
          />
          {phone.trim() && !isValidPhone(phone) ? (
            <span className="mt-1 block text-[11.5px] text-muted">
              Poné el número completo, con característica.
            </span>
          ) : null}
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-[14px] font-bold text-foreground">
          Dirección de entrega
        </h2>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Calle y número
          </span>
          <input
            type="text"
            value={street}
            disabled={!ready}
            onChange={(event) => saveAddress({ street: event.target.value })}
            placeholder="Ej: Urquiza 1234"
            maxLength={200}
            autoComplete="street-address"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">
            Referencia (opcional)
          </span>
          <input
            type="text"
            value={reference}
            disabled={!ready}
            onChange={(event) => saveAddress({ reference: event.target.value })}
            placeholder="Ej: portón verde, entre calles"
            maxLength={200}
            className={inputClass}
          />
        </label>
        {hasPin ? (
          <p className="flex items-center justify-between gap-3 text-[12px] text-muted">
            <span>Tenés tu ubicación marcada en el mapa.</span>
            <button
              type="button"
              onClick={removePin}
              className="shrink-0 font-semibold text-brand-dark"
            >
              Quitar
            </button>
          </p>
        ) : (
          <p className="text-[12px] text-muted">
            Al hacer un pedido podés marcar tu ubicación en el mapa.
          </p>
        )}
      </section>

      <p className="px-1 text-[11.5px] leading-relaxed text-muted">
        Tus datos se guardan solo en este celular y viajan con cada pedido
        para que el comercio y el repartidor puedan ubicarte.
      </p>

      <nav className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        <RowLink href="/pedidos" title="Mis pedidos" text="Seguimiento e historial" />
        <RowLink
          href="/sumate"
          title="Sumá tu comercio"
          text={`Vendé a domicilio en ${appConfig.city}`}
        />
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-foreground">
              Ayuda
            </span>
            <span className="block text-[12px] text-muted">
              Escribinos por WhatsApp
            </span>
          </span>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
        </a>
      </nav>

      <ClearOrdersButton />

      <p className="pt-2 text-center text-[11.5px] text-muted">
        ¿Sos parte del equipo?{" "}
        <Link href="/dueno" className="font-semibold text-foreground underline">
          Panel del comercio
        </Link>{" "}
        ·{" "}
        <Link href="/repartidor" className="font-semibold text-foreground underline">
          Panel del repartidor
        </Link>
      </p>
    </div>
  );
}

function RowLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-foreground">
          {title}
        </span>
        <span className="block text-[12px] text-muted">{text}</span>
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
