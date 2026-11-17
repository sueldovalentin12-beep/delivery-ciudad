"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons";
import type { Merchant } from "@/lib/demo-data";
import {
  statusLabel,
  todayHours,
  weekSchedule,
  whenLong,
} from "@/lib/hours";
import { useOpenStatus } from "@/lib/use-open-status";

/**
 * Piezas que muestran si un comercio está abierto. Las páginas son estáticas,
 * así que todo se calcula en el celular, con la hora real de Argentina
 * (ver lib/hours). Hasta que se hidrata queda un lugar vacío del mismo
 * alto: la página no salta.
 */

/** "Abierto · cierra 00:30" / "Cerrado · abre 19:00", en una línea de alto fijo. */
export function OpenLabel({
  merchant,
  className = "text-[11px]",
}: {
  merchant: Merchant;
  className?: string;
}) {
  const status = useOpenStatus(merchant);
  return (
    <span
      className={`flex h-4 items-center gap-1.5 font-medium ${className} ${
        status && !status.open ? "text-muted" : "text-brand-dark"
      }`}
    >
      {status ? (
        <>
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              status.open ? "bg-brand" : "bg-muted/60"
            }`}
            aria-hidden
          />
          <span className="truncate">{statusLabel(status.change)}</span>
        </>
      ) : null}
    </span>
  );
}

/** Cartelito "Cerrado" para poner sobre la foto. No ocupa lugar si está abierto. */
export function ClosedChip({ merchant }: { merchant: Merchant }) {
  const status = useOpenStatus(merchant);
  if (!status || status.open) return null;
  return (
    <span className="anim-fade-in absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
      Cerrado
    </span>
  );
}

/** ¿Está cerrado ahora? false mientras no sabemos (no bloqueamos de entrada). */
export function useIsClosed(merchant: Merchant | undefined) {
  const status = useOpenStatus(merchant);
  return status ? !status.open : false;
}

/** Aviso grande de la página del comercio cuando está cerrado. */
export function ClosedNotice({ merchant }: { merchant: Merchant }) {
  const status = useOpenStatus(merchant);
  if (!status || status.open) return null;
  return (
    <p
      role="status"
      className="anim-fade-up mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12.5px] font-semibold leading-snug text-amber-800"
    >
      Cerrado ahora{status.change ? ` · abre ${whenLong(status.change)}` : ""}.
      <span className="mt-0.5 block text-[11.5px] font-normal">
        Podés mirar el menú, pero por ahora no se puede pedir.
      </span>
    </p>
  );
}

/** Horario de hoy y la semana completa, desplegable. */
export function HoursPanel({ merchant }: { merchant: Merchant }) {
  const status = useOpenStatus(merchant);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 rounded-2xl border border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block h-4 text-[12.5px] font-semibold leading-4 text-foreground">
            {status ? `Hoy: ${todayHours(merchant, status.now)}` : null}
          </span>
          <OpenLabel merchant={merchant} />
        </span>
        <span className="text-[11.5px] font-semibold text-brand-dark">
          {open ? "Ocultar" : "Ver horarios"}
        </span>
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="anim-fade-in space-y-1.5 border-t border-line px-3 py-2.5 text-[12px]">
          <dl className="space-y-1.5">
          {weekSchedule(merchant).map((row) => (
            <div key={row.days} className="flex justify-between gap-3">
              <dt className="text-muted">{row.days}</dt>
              <dd className="text-right font-medium tabular-nums text-foreground">
                {row.hours}
              </dd>
            </div>
          ))}
          </dl>
          <p className="pt-1 text-[11px] text-muted">Hora de Argentina.</p>
        </div>
      ) : null}
    </div>
  );
}
