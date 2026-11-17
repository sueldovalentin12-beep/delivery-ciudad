"use client";

import { useState } from "react";

/**
 * Cuenta cuántas veces cambió `value` desde que se montó (0 mientras no
 * cambió). Sirve de `key` para repetir una animación solo cuando algo
 * cambia de verdad, no al cargar la pantalla. Con `null` (todavía
 * cargando) no cuenta: el primer valor real no hace saltar nada.
 */
export function useBump(value: string | number | null): number {
  const [prev, setPrev] = useState(value);
  const [bump, setBump] = useState(0);
  if (prev !== value) {
    setPrev(value);
    if (prev !== null) setBump((current) => current + 1);
  }
  return bump;
}
