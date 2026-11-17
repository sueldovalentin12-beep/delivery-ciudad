"use client";

import { useEffect, useRef, useState } from "react";
import { MOTO_SVG } from "@/components/moto-icon";

/**
 * Mapa de seguimiento en vivo: la casita es la dirección de entrega y la moto
 * es el repartidor, que se desliza entre una ubicación y la siguiente (nunca
 * se teletransporta). Se dibuja con Leaflet (librería de mapas gratis) y mapas
 * de OpenStreetMap.
 */

export type MapPoint = { lat: number; lng: number };

type LatLngTuple = [number, number];

type LeafletMarker = {
  addTo: (map: unknown) => LeafletMarker;
  setLatLng: (center: LatLngTuple) => LeafletMarker;
  getElement: () => HTMLElement | undefined;
  remove: () => void;
};

type LeafletPolyline = {
  addTo: (map: unknown) => LeafletPolyline;
  setLatLngs: (points: LatLngTuple[]) => LeafletPolyline;
  remove: () => void;
};

type LeafletBounds = {
  contains: (point: LatLngTuple) => boolean;
  pad: (ratio: number) => LeafletBounds;
};

type LeafletMap = {
  setView: (center: LatLngTuple, zoom: number, options?: { animate?: boolean }) => unknown;
  fitBounds: (
    bounds: LatLngTuple[],
    options?: {
      paddingTopLeft?: [number, number];
      paddingBottomRight?: [number, number];
      maxZoom?: number;
      animate?: boolean;
    },
  ) => unknown;
  getBounds: () => LeafletBounds;
  on: (event: string, handler: () => void) => unknown;
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletLike = {
  map: (
    container: HTMLElement,
    options?: { zoomControl?: boolean; attributionControl?: boolean },
  ) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => {
    addTo: (map: unknown) => unknown;
  };
  marker: (
    center: LatLngTuple,
    options: { icon: unknown; interactive?: boolean; keyboard?: boolean; zIndexOffset?: number },
  ) => LeafletMarker;
  divIcon: (options: {
    html: string;
    className: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  }) => unknown;
  polyline: (
    points: LatLngTuple[],
    options: Record<string, unknown>,
  ) => LeafletPolyline;
};

let leafletPromise: Promise<LeafletLike> | null = null;

/** Carga Leaflet una sola vez y devuelve la librería lista. */
function loadLeaflet(): Promise<LeafletLike> {
  if (!leafletPromise) {
    leafletPromise = (async () => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("no se pudo cargar el mapa"));
        document.head.appendChild(script);
      });
      return (window as unknown as { L: LeafletLike }).L;
    })().catch((error) => {
      // Si falló (sin internet), la próxima vez se vuelve a intentar.
      leafletPromise = null;
      throw error;
    });
  }
  return leafletPromise;
}

const MOTO_W = 60;
const MOTO_H = 41;

const motoHtml = `<div class="moto-marker"><span class="moto-ring"></span><div class="moto-flip"><div class="moto-bob">${MOTO_SVG}</div></div></div>`;

/** Casita de destino: pin en el color de la marca con una casa adentro. */
const destinationHtml = `<svg class="dest-pin" width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
  <path d="M20 47 C20 47 4 31 4 19 a16 16 0 0 1 32 0 C36 31 20 47 20 47 Z" fill="var(--brand)" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M12.5 20.5 L20 13.5 L27.5 20.5 V27 a1 1 0 0 1 -1 1 H23 v-5.5 h-6 V28 h-3.5 a1 1 0 0 1 -1 -1 Z" fill="#ffffff"/>
</svg>`;

type Padding = { top: number; right: number; bottom: number; left: number };

/** Encuadra los puntos que haya (uno solo: lo centra). */
function fitMap(
  map: LeafletMap,
  points: LatLngTuple[],
  padding: Padding,
  animate: boolean,
  programmatic: { current: boolean },
) {
  if (points.length === 0) return;
  programmatic.current = true;
  if (points.length === 1) {
    map.setView(points[0], 16, { animate });
    return;
  }
  map.fitBounds(points, {
    paddingTopLeft: [padding.left, padding.top],
    paddingBottomRight: [padding.right, padding.bottom],
    maxZoom: 17,
    animate,
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const DEFAULT_PADDING: Padding = { top: 48, right: 40, bottom: 48, left: 40 };

type Anim = {
  raf: number;
  from: LatLngTuple;
  to: LatLngTuple;
  start: number;
  duration: number;
};

export function CourierMap({
  delivery,
  courier,
  className = "h-48 w-full overflow-hidden rounded-xl border border-line",
  animateMs = 3800,
  fitPadding = DEFAULT_PADDING,
  showRecenter = false,
  creditBottom = 6,
}: {
  /** Dirección de entrega (si el pedido tiene ubicación). */
  delivery?: MapPoint | null;
  /** Última ubicación del repartidor (mientras va en camino). */
  courier?: MapPoint | null;
  /** Tamaño y bordes del mapa. Por defecto es el mapa chico. */
  className?: string;
  /** Cuánto tarda la moto en deslizarse hasta la ubicación nueva. */
  animateMs?: number;
  /** Margen al encuadrar (sirve para que la hoja de abajo no tape nada). */
  fitPadding?: Padding;
  /** Muestra el botón flotante "Centrar". */
  showRecenter?: boolean;
  /** Distancia del crédito de OpenStreetMap al borde de abajo (px). */
  creditBottom?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<{ map: LeafletMap; L: LeafletLike } | null>(
    null,
  );
  const [error, setError] = useState(false);

  const deliveryRef = useRef<MapPoint | null>(delivery ?? null);
  const courierRef = useRef<MapPoint | null>(courier ?? null);
  const paddingRef = useRef(fitPadding);
  const animateMsRef = useRef(animateMs);
  const destMarkerRef = useRef<LeafletMarker | null>(null);
  const motoRef = useRef<LeafletMarker | null>(null);
  const lineRef = useRef<LeafletPolyline | null>(null);
  const animRef = useRef<Anim | null>(null);
  const shownRef = useRef<LatLngTuple | null>(null);
  /** La persona movió el mapa con el dedo: no lo volvemos a encuadrar solos. */
  const userMovedRef = useRef(false);
  /** Estamos moviendo el mapa nosotros (para no confundirlo con un gesto). */
  const programmaticRef = useRef(false);

  const deliveryLat = delivery?.lat;
  const deliveryLng = delivery?.lng;
  const courierLat = courier?.lat;
  const courierLng = courier?.lng;

  useEffect(() => {
    deliveryRef.current =
      deliveryLat !== undefined && deliveryLng !== undefined
        ? { lat: deliveryLat, lng: deliveryLng }
        : null;
    courierRef.current =
      courierLat !== undefined && courierLng !== undefined
        ? { lat: courierLat, lng: courierLng }
        : null;
    paddingRef.current = fitPadding;
    animateMsRef.current = animateMs;
  });

  // Crea el mapa una sola vez.
  useEffect(() => {
    let cancelled = false;
    let created: LeafletMap | null = null;
    loadLeaflet()
      .then((L) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        const map = L.map(container, {
          zoomControl: false,
          attributionControl: false,
        });
        const start = deliveryRef.current ?? courierRef.current;
        map.setView(start ? [start.lat, start.lng] : [0, 0], 16, {
          animate: false,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);
        map.on("dragstart", () => {
          userMovedRef.current = true;
        });
        map.on("zoomstart", () => {
          if (!programmaticRef.current) userMovedRef.current = true;
        });
        map.on("moveend", () => {
          programmaticRef.current = false;
        });
        map.invalidateSize();
        created = map;
        setView({ map, L });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current.raf);
      animRef.current = null;
      motoRef.current?.remove();
      destMarkerRef.current?.remove();
      lineRef.current?.remove();
      motoRef.current = null;
      destMarkerRef.current = null;
      lineRef.current = null;
      shownRef.current = null;
      created?.remove();
      setView(null);
    };
  }, []);

  // El mapa se agranda o se achica con la pantalla (barra del navegador, giro).
  useEffect(() => {
    if (!view || !containerRef.current) return;
    const observer = new ResizeObserver(() => view.map.invalidateSize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [view]);

  // Casita de destino.
  useEffect(() => {
    if (!view) return;
    const { map, L } = view;
    destMarkerRef.current?.remove();
    destMarkerRef.current = null;
    if (deliveryLat === undefined || deliveryLng === undefined) return;
    destMarkerRef.current = L.marker([deliveryLat, deliveryLng], {
      icon: L.divIcon({
        html: destinationHtml,
        className: "dest-div-icon",
        iconSize: [40, 48],
        iconAnchor: [20, 46],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
    if (!courierRef.current) {
      fitMap(
        map,
        [[deliveryLat, deliveryLng]],
        paddingRef.current,
        false,
        programmaticRef,
      );
    }
      }, [view, deliveryLat, deliveryLng]);

  // Moto del repartidor: aparece, se desliza y mira para donde avanza.
  useEffect(() => {
    if (!view) return;
    const { map, L } = view;

    if (courierLat === undefined || courierLng === undefined) {
      if (animRef.current) cancelAnimationFrame(animRef.current.raf);
      animRef.current = null;
      motoRef.current?.remove();
      motoRef.current = null;
      lineRef.current?.remove();
      lineRef.current = null;
      shownRef.current = null;
      return;
    }

    const target: LatLngTuple = [courierLat, courierLng];
    const reduced = prefersReducedMotion();
    const brand = getComputedStyle(document.documentElement)
      .getPropertyValue("--brand")
      .trim();

    function drawLine(from: LatLngTuple) {
      const d = deliveryRef.current;
      if (!d) return;
      const points: LatLngTuple[] = [from, [d.lat, d.lng]];
      if (lineRef.current) lineRef.current.setLatLngs(points);
      else {
        lineRef.current = L.polyline(points, {
          color: brand || "currentColor",
          weight: 3,
          opacity: 0.85,
          dashArray: "6 9",
          lineCap: "round",
          interactive: false,
        }).addTo(map);
      }
    }

    function place(point: LatLngTuple) {
      shownRef.current = point;
      motoRef.current?.setLatLng(point);
      drawLine(point);
    }

    function pointsFor(point: LatLngTuple): LatLngTuple[] {
      const d = deliveryRef.current;
      return d ? [[d.lat, d.lng], point] : [point];
    }

    function setMoving(moving: boolean) {
      motoRef.current
        ?.getElement()
        ?.querySelector(".moto-marker")
        ?.classList.toggle("is-moving", moving);
    }

    const first = !motoRef.current;
    if (first) {
      motoRef.current = L.marker(target, {
        icon: L.divIcon({
          html: motoHtml,
          className: "moto-div-icon",
          iconSize: [MOTO_W, MOTO_H],
          iconAnchor: [MOTO_W / 2, MOTO_H - 4],
        }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000,
      }).addTo(map);
      place(target);
      userMovedRef.current = false;
      fitMap(map, pointsFor(target), paddingRef.current, false, programmaticRef);
      return;
    }

    // Mira hacia donde va: este / oeste.
    const from = shownRef.current ?? target;
    const dx = target[1] - from[1];
    if (Math.abs(dx) > 1e-6) {
      motoRef.current
        ?.getElement()
        ?.querySelector(".moto-flip")
        ?.classList.toggle("is-west", dx < 0);
    }

    // Si se fue de la parte visible, volvemos a encuadrar (salvo que la persona
    // esté mirando otra zona a propósito y siga dentro de pantalla).
    const visible = map.getBounds().pad(-0.12);
    const d = deliveryRef.current;
    const outOfView =
      !visible.contains(target) ||
      (d ? !visible.contains([d.lat, d.lng]) : false);
    if (outOfView) {
      userMovedRef.current = false;
      fitMap(map, pointsFor(target), paddingRef.current, !reduced, programmaticRef);
    } else if (!userMovedRef.current) {
      fitMap(map, pointsFor(target), paddingRef.current, !reduced, programmaticRef);
    }

    if (animRef.current) cancelAnimationFrame(animRef.current.raf);
    if (reduced) {
      animRef.current = null;
      place(target);
      return;
    }

    setMoving(true);
    const anim: Anim = {
      raf: 0,
      from,
      to: target,
      start: performance.now(),
      duration: Math.max(600, animateMsRef.current),
    };
    const step = (now: number) => {
      const t = Math.min(1, (now - anim.start) / anim.duration);
      // Velocidad constante: así no frena y arranca en cada ubicación nueva.
      place([
        anim.from[0] + (anim.to[0] - anim.from[0]) * t,
        anim.from[1] + (anim.to[1] - anim.from[1]) * t,
      ]);
      if (t < 1) {
        anim.raf = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        setMoving(false);
      }
    };
    anim.raf = requestAnimationFrame(step);
    animRef.current = anim;
      }, [view, courierLat, courierLng]);

  function recenter() {
    if (!view) return;
    userMovedRef.current = false;
    const target =
      shownRef.current ??
      (courierRef.current
        ? ([courierRef.current.lat, courierRef.current.lng] as LatLngTuple)
        : null);
    const d = deliveryRef.current;
    const points: LatLngTuple[] = [];
    if (d) points.push([d.lat, d.lng]);
    if (target) points.push(target);
    fitMap(
      view.map,
      points,
      paddingRef.current,
      !prefersReducedMotion(),
      programmaticRef,
    );
  }

  if (error) {
    return (
      <div
        className={`${className} grid place-items-center bg-surface p-4 text-center`}
      >
        <p className="max-w-[16rem] text-[12px] leading-relaxed text-muted">
          El mapa no se pudo cargar (¿hay internet?). El estado del pedido se
          actualiza igual.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative isolate bg-surface ${className}`}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label="Mapa de seguimiento del repartidor"
      />
      {!view ? <div className="skeleton absolute inset-0" aria-hidden /> : null}
      <span
        className="pointer-events-none absolute left-2 z-[400] rounded bg-white/80 px-1 text-[9px] text-muted"
        style={{ bottom: creditBottom }}
      >
        © OpenStreetMap
      </span>
      {showRecenter && view ? (
        <button
          type="button"
          onClick={recenter}
          className="absolute right-3 top-3 z-[500] rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-brand-dark shadow-md"
        >
          Centrar
        </button>
      ) : null}
    </div>
  );
}
