"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

/**
 * Control de cantidad: "- 2 +".
 * Con cantidad 0 se ve solo el "+"; al tocarlo, el control se abre hacia la
 * izquierda y aparece el "- 1 +" (una sola pieza que cambia de ancho, no un
 * cambio de botones). Lo usan el menú del comercio y el carrito.
 */
export function QtyStepper({
  qty,
  itemName,
  onIncrement,
  onDecrement,
  disableAdd = false,
}: {
  qty: number;
  itemName: string;
  onIncrement: () => void;
  onDecrement: () => void;
  /** No deja sumar (ej. el comercio está cerrado). Restar sigue andando. */
  disableAdd?: boolean;
}) {
  const open = qty > 0;

  return (
    <div
      className={`flex h-9 shrink-0 items-center justify-end overflow-hidden rounded-full p-1 shadow-sm transition-[width,background-color] duration-300 ease-out ${
        open ? "w-[5.25rem] bg-brand-soft" : "w-9 bg-brand"
      }`}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={!open}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open || undefined}
        aria-label={`Quitar uno de ${itemName}`}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-brand-dark transition-[opacity,scale] duration-200 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
        }`}
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>
      <span
        aria-live="polite"
        aria-hidden={!open || undefined}
        className={`w-5 shrink-0 text-center text-[13px] font-bold tabular-nums text-brand-dark transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {qty > 0 ? qty : ""}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disableAdd}
        aria-label={open ? `Agregar otro ${itemName}` : `Agregar ${itemName} al carrito`}
        className={`grid shrink-0 place-items-center rounded-full transition-[background-color,scale,opacity] duration-300 disabled:opacity-35 motion-safe:active:scale-90 ${
          open ? "h-7 w-7 bg-white text-brand-dark" : "h-7 w-7 bg-transparent text-white"
        }`}
      >
        <PlusIcon className={open ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    </div>
  );
}
