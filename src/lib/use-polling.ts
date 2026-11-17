"use client";

import { useEffect, useRef } from "react";

/**
 * Ejecuta `callback` al montar y después cada `intervalMs`, pero solo
 * mientras la pestaña está a la vista. Al volver a mostrarse refresca de
 * inmediato.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true,
): void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") callbackRef.current();
    };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, intervalMs]);
}
