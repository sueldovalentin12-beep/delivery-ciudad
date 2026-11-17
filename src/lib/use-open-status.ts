"use client";

import { useMemo, useSyncExternalStore } from "react";
import { isOpenAt, nextChange, type HasHours, type NextChange } from "@/lib/hours";

/**
 * Reloj compartido que avanza de a un minuto. Las páginas se generan
 * estáticas, así que "ahora" NO puede ir en el HTML: en el servidor devuelve
 * null (estado neutro) y recién después de hidratar toma la hora real.
 * Un solo timer para toda la app, sin importar cuántas tarjetas lo usen.
 */
const listeners = new Set<() => void>();
let minute = -1;
let timer: ReturnType<typeof setInterval> | null = null;

function currentMinute() {
  return Math.floor(Date.now() / 60_000);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    minute = currentMinute();
    timer = setInterval(() => {
      const next = currentMinute();
      if (next === minute) return;
      minute = next;
      listeners.forEach((notify) => notify());
    }, 10_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      minute = -1;
    }
  };
}

function getSnapshot() {
  return minute >= 0 ? minute : currentMinute();
}

/** La hora actual (al minuto), o null hasta que la página se hidrata. */
export function useNow(): Date | null {
  const stamp = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return useMemo(() => (stamp === null ? null : new Date(stamp * 60_000)), [stamp]);
}

export type OpenStatus = {
  open: boolean;
  change: NextChange | null;
  now: Date;
};

/** Si el comercio está abierto ahora y cuándo cambia. null = todavía no sabemos. */
export function useOpenStatus(merchant: HasHours | undefined): OpenStatus | null {
  const now = useNow();
  return useMemo(() => {
    if (!now || !merchant) return null;
    return { open: isOpenAt(merchant, now), change: nextChange(merchant, now), now };
  }, [now, merchant]);
}
