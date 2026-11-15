"use client";

import { useEffect, useState } from "react";
import { clearOrders, readOrders } from "@/lib/orders";

/**
 * Botón para borrar el historial de pedidos guardado en el celular.
 * Pensado para el piloto: las pruebas anteriores quedan como pedidos
 * "Entregado" y confunden; con esto se limpian de un toque.
 */
export function ClearOrdersButton() {
  const [count, setCount] = useState<number | null>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    setCount(readOrders().length);
  }, []);

  if (count === 0 && !cleared) return null;

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-[14px] font-bold text-foreground">🧹 Pedidos de prueba</p>
      <p className="mt-0.5 text-[12px] text-muted">
        {cleared
          ? "Historial borrado. Los próximos pedidos van a arrancar limpios."
          : `Tenés ${count} pedido${count === 1 ? "" : "s"} guardado${count === 1 ? "" : "s"} en este celular.`}
      </p>
      {!cleared ? (
        <button
          type="button"
          onClick={() => {
            clearOrders();
            setCleared(true);
          }}
          className="mt-2 rounded-xl border border-line bg-surface px-4 py-2 text-[12.5px] font-semibold text-foreground transition active:scale-[0.99]"
        >
          Borrar historial de este celular
        </button>
      ) : null}
    </div>
  );
}
