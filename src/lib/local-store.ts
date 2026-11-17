"use client";

import { useSyncExternalStore } from "react";

/**
 * Mini almacén sobre localStorage / sessionStorage.
 * Sirve para leer datos guardados en el celular sin romper la hidratación:
 * en el servidor (y en el primer render del cliente) el valor es `undefined`;
 * recién después de hidratar aparece el valor guardado (o `null` si no hay).
 * Todas las escrituras pasan por acá, así los componentes se enteran solos.
 */

export type StorageArea = "local" | "session";

const listeners = new Set<() => void>();
/** Copia en memoria: si el navegador no deja guardar (incógnito), igual funciona. */
const memory = new Map<string, string | null>();

function memoryId(area: StorageArea, key: string) {
  return `${area}:${key}`;
}

function area(areaName: StorageArea): Storage {
  return areaName === "local" ? window.localStorage : window.sessionStorage;
}

export function readStored(key: string, areaName: StorageArea = "local"): string | null {
  const id = memoryId(areaName, key);
  if (memory.has(id)) return memory.get(id) ?? null;
  try {
    return area(areaName).getItem(key);
  } catch {
    return null;
  }
}

/** Guarda (o borra, con `null`) y avisa a quienes estén mirando ese dato. */
export function writeStored(
  key: string,
  value: string | null,
  areaName: StorageArea = "local",
): void {
  memory.set(memoryId(areaName, key), value);
  try {
    if (value === null) area(areaName).removeItem(key);
    else area(areaName).setItem(key, value);
  } catch {
    // Modo incógnito o sin espacio: el dato vive solo en memoria.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  // Cambios hechos desde otra pestaña.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null) memory.clear();
    else {
      memory.delete(memoryId("local", event.key));
      memory.delete(memoryId("session", event.key));
    }
    callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Valor guardado bajo `key`. `undefined` mientras no hidratamos, `null` si
 * no hay nada guardado.
 */
export function useStored(
  key: string,
  areaName: StorageArea = "local",
): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => readStored(key, areaName),
    () => undefined,
  );
}
