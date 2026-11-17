"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useIsClosed } from "@/components/open-status";
import { QtyStepper } from "@/components/qty-stepper";
import { buildItemKey, useCart } from "@/lib/cart";
import { getMerchantBySlug } from "@/lib/demo-data";

/**
 * Botón de un plato del menú del comercio.
 * Si el plato todavía no está en el carrito muestra un "+".
 * Si ya está, se transforma en "- 2 +" para cambiar la cantidad.
 * Un pedido es de un solo comercio: si el carrito es de otro, pregunta
 * antes de vaciarlo. Si el comercio está cerrado, el "+" queda desactivado
 * (se puede mirar el menú, no pedir).
 */
export function CartButton({
  merchantSlug,
  merchantName,
  itemId,
  name,
  price,
  emoji,
}: {
  merchantSlug: string;
  merchantName: string;
  itemId: string;
  name: string;
  price: number;
  emoji: string;
}) {
  const {
    add,
    replaceWith,
    changeQty,
    qtyOf,
    merchantSlug: cartSlug,
    merchantName: cartName,
  } = useCart();
  const [asking, setAsking] = useState(false);
  const closed = useIsClosed(getMerchantBySlug(merchantSlug));
  const key = buildItemKey(merchantSlug, itemId);
  const qty = qtyOf(key);
  const item = { key, merchantSlug, merchantName, name, price, emoji };

  return (
    <>
      <QtyStepper
        qty={qty}
        itemName={name}
        disableAdd={closed}
        onIncrement={() => {
          if (cartSlug && cartSlug !== merchantSlug) {
            setAsking(true);
            return;
          }
          add(item);
        }}
        onDecrement={() => changeQty(key, -1)}
      />
      {asking ? (
        <ReplaceCartDialog
          currentName={cartName ?? "otro comercio"}
          nextName={merchantName}
          onConfirm={() => {
            replaceWith(item);
            setAsking(false);
          }}
          onCancel={() => setAsking(false)}
        />
      ) : null}
    </>
  );
}

/** Aviso a pantalla completa: "tu carrito es de otro comercio". */
function ReplaceCartDialog({
  currentName,
  nextName,
  onConfirm,
  onCancel,
}: {
  currentName: string;
  nextName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-cart-title"
        className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-xl"
      >
        <h2
          id="replace-cart-title"
          className="text-[14.5px] font-bold text-foreground"
        >
          ¿Cambiamos de comercio?
        </h2>
        <p className="text-[13px] leading-relaxed text-muted">
          Tu carrito tiene productos de {currentName}. ¿Lo vaciamos para pedir
          en {nextName}?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line py-2.5 text-[13px] font-semibold text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99]"
          >
            Vaciar y agregar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
