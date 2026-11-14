"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { QtyStepper } from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { appConfig } from "@/lib/config";
import { formatPrice } from "@/lib/demo-data";
import { saveOrder, type Order } from "@/lib/orders";

export function CartView() {
  const { items, ready, subtotal, count, changeQty, clear } = useCart();
  const [confirmed, setConfirmed] = useState<Order | null>(null);

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
    return <OrderConfirmation order={confirmed} />;
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

  function confirmOrder() {
    const order = saveOrder({ items, subtotal, deliveryFee, total });
    clear();
    setConfirmed(order);
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
          className="w-full rounded-2xl bg-brand py-3.5 text-[14.5px] font-bold text-white transition active:scale-[0.99]"
        >
          Confirmar pedido · {formatPrice(total)}
        </button>
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

function OrderConfirmation({ order }: { order: Order }) {
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

      <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
        Esto es una prueba: el pedido quedó guardado en tu celular y todavía no
        le llega al comercio.
      </p>

      <div className="mt-5 space-y-2">
        <Link
          href="/pedidos"
          className="block rounded-2xl bg-brand py-3 text-[14px] font-bold text-white"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/"
          className="block rounded-2xl border border-line py-3 text-[14px] font-semibold text-foreground"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
