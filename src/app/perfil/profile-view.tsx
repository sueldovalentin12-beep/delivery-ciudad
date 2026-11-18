"use client";

import Link from "next/link";
import type { DeliveryAddress } from "@/lib/address";
import { appConfig } from "@/lib/config";
import type { Customer } from "@/lib/customer";
import { isValidPhone } from "@/lib/customer";
import { useStored, writeStored } from "@/lib/local-store";
import {
  ChevronRightIcon,
  HelpIcon,
  PinIcon,
  ReceiptIcon,
  StoreIcon,
  UserIcon,
} from "@/components/icons";
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

  const trimmed = name.trim();
  const initials = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <span
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-soft text-[22px] font-extrabold text-brand-dark"
          aria-hidden
        >
          {initials || <UserIcon className="h-7 w-7" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[20px] font-extrabold text-foreground">
            {trimmed || "Hola"}
          </p>
          <p className="text-[12.5px] text-muted">
            {trimmed
              ? `Tu perfil en ${appConfig.name}`
              : "Completá tus datos para pedir más rápido"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2">
        <Tile href="/pedidos" label="Mis pedidos" icon={<ReceiptIcon className="h-6 w-6" />} />
        <Tile href="#direccion" label="Dirección" icon={<PinIcon className="h-6 w-6" />} />
        <Tile href="/sumate" label="Sumá tu comercio" icon={<StoreIcon className="h-6 w-6" />} />
        <Tile href={helpUrl} external label="Ayuda" icon={<HelpIcon className="h-6 w-6" />} />
      </div>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-extrabold text-foreground">Tus datos</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        <label className="block px-4 py-3">
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
        <label className="block px-4 py-3">
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
        </div>
      </section>

      <section id="direccion" className="scroll-mt-20">
        <h2 className="mb-2 px-1 text-[13px] font-extrabold text-foreground">
          Dirección de entrega
        </h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        <label className="block px-4 py-3">
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
        <label className="block px-4 py-3">
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
          <p className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] text-muted">
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
          <p className="px-4 py-3 text-[12px] text-muted">
            Al hacer un pedido podés marcar tu ubicación en el mapa.
          </p>
        )}
        </div>
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

      <p className="pt-2 text-center text-[11px] text-muted">
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

function Tile({
  href,
  label,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white px-1 py-3 text-center transition active:scale-[0.97]";
  const content = (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand-dark">
        {icon}
      </span>
      <span className="text-[11px] font-semibold leading-tight text-foreground">
        {label}
      </span>
    </>
  );
  if (external || href.startsWith("#")) {
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
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
