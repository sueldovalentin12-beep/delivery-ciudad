"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

/**
 * Control de cantidad: "- 2 +".
 * Con cantidad 0 se muestra un solo botón "+".
 * Lo usan el menú del comercio y el carrito, así se comportan igual.
 */
export function QtyStepper({
  qty,
  itemName,
  onIncrement,
  onDecrement,
}: {
  qty: number;
  itemName: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Agregar ${itemName} al carrito`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-dark transition active:scale-90"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft p-1">
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Quitar uno de ${itemName}`}
        className="grid h-7 w-7 place-items-center rounded-full bg-white text-brand-dark transition active:scale-90"
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>
      <span
        aria-live="polite"
        className="min-w-4 text-center text-[13px] font-bold tabular-nums text-brand-dark"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Agregar otro ${itemName}`}
        className="grid h-7 w-7 place-items-center rounded-full bg-white text-brand-dark transition active:scale-90"
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
