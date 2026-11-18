"use client";

import Link from "next/link";
import { CartIcon, ChevronDownIcon, PinIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { useStored } from "@/lib/local-store";
import { useBump } from "@/lib/use-bump";

/**
 * Dirección de entrega del inicio: "Villaguay" y, si la persona ya guardó su
 * calle en el perfil, la calle. Lleva al perfil para cambiarla.
 */
export function AddressSelector({ city }: { city: string }) {
  const raw = useStored("altoque.address.v1");
  let street = "";
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "street" in parsed) {
        const value = (parsed as { street: unknown }).street;
        if (typeof value === "string") street = value.trim();
      }
    } catch {
      // dato roto: lo tratamos como si no hubiera dirección guardada
    }
  }

  return (
    <Link
      href="/perfil"
      aria-label="Cambiar dirección de entrega"
      className="flex min-w-0 items-center gap-2 text-white"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20">
        <PinIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-[11px] font-medium leading-none text-white/80">
          Enviar a
        </span>
        <span className="mt-1 flex items-center gap-0.5 text-[15px] font-extrabold leading-none">
          <span className="truncate">{street || city}</span>
          <ChevronDownIcon className="h-4 w-4 shrink-0" />
        </span>
      </span>
    </Link>
  );
}

/** Ícono de carrito del encabezado, con la cantidad de productos encima. */
export function CartBadge({ onBrand = false }: { onBrand?: boolean }) {
  const { count, ready } = useCart();
  const bump = useBump(ready ? count : null);

  return (
    <Link
      href="/carrito"
      aria-label={
        count > 0 ? `Ver carrito, ${count} productos` : "Ver carrito"
      }
      className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full ${
        onBrand
          ? "bg-white text-brand-dark shadow-sm"
          : "border border-line text-foreground"
      }`}
    >
      <CartIcon />
      {count > 0 ? (
        <span
          key={bump}
          className={`absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-dark px-1 text-[10px] font-bold leading-none text-white ${onBrand ? "ring-2 ring-brand " : ""}${
            bump > 0 ? "anim-pop" : ""
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
