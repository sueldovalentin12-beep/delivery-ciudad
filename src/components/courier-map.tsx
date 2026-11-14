"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mapa de seguimiento en vivo: el punto verde es la dirección de entrega y
 * el azul es el repartidor moviéndose. Se dibuja con Leaflet (librería de
 * mapas gratis) y mapas de OpenStreetMap.
 */

export type MapPoint = { lat: number; lng: number };

type LeafletMarker = {
  addTo: (map: unknown) => LeafletMarker;
  setLatLng: (center: [number, number]) => LeafletMarker;
};

type LeafletLike = {
  map: (
    container: HTMLElement,
    options?: { zoomControl?: boolean },
  ) => {
    setView: (center: [number, number], zoom: number) => unknown;
    remove: () => void;
    invalidateSize: () => void;
  };
  tileLayer: (url: string, options?: Record<string, unknown>) => {
    addTo: (map: unknown) => LeafletMarker;
  };
  circleMarker: (
    center: [number, number],
    options: {
      radius: number;
      color: string;
      fillColor: string;
      fillOpacity: number;
      weight: number;
    },
  ) => LeafletMarker;
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
    })();
  }
  return leafletPromise;
}

const DELIVERY_STYLE = {
  radius: 9,
  color: "#ffffff",
  fillColor: "#56c232",
  fillOpacity: 1,
  weight: 3,
};
const COURIER_STYLE = {
  radius: 8,
  color: "#ffffff",
  fillColor: "#2563eb",
  fillOpacity: 1,
  weight: 3,
};

export function CourierMap({
  delivery,
  courier,
}: {
  delivery: MapPoint;
  courier?: MapPoint | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<ReturnType<LeafletLike["map"]> | null>(null);
  const leafletRef = useRef<LeafletLike | null>(null);
  const deliveryRef = useRef<ReturnType<LeafletLike["circleMarker"]> | null>(null);
  const courierRef = useRef<ReturnType<LeafletLike["circleMarker"]> | null>(null);
  const [error, setError] = useState(false);

  // Crea el mapa una vez.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { zoomControl: false });
        leafletRef.current = L;
        map.setView([delivery.lat, delivery.lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);
        deliveryRef.current = L.circleMarker([delivery.lat, delivery.lng], DELIVERY_STYLE).addTo(map);
        if (courier) {
          courierRef.current = L.circleMarker([courier.lat, courier.lng], COURIER_STYLE).addTo(map);
        }
        map.invalidateSize();
        mapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mueve los marcadores cuando cambia la posición del repartidor.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !courier) return;
    if (!courierRef.current) {
      courierRef.current = L.circleMarker([courier.lat, courier.lng], COURIER_STYLE).addTo(map);
      return;
    }
    courierRef.current.setLatLng([courier.lat, courier.lng]);
  }, [courier]);

  if (error) {
    return (
      <p className="rounded-xl border border-line bg-surface p-3 text-[12px] text-muted">
        El mapa no se pudo cargar (¿hay internet?). El estado del pedido se
        actualiza igual.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        ref={containerRef}
        className="h-48 w-full overflow-hidden rounded-xl border border-line"
        aria-label="Mapa de seguimiento del repartidor"
      />
      <p className="text-[11.5px] text-muted">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand align-middle" />{" "}
        Destino
        {courier ? (
          <>
            {" · "}
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 align-middle" />{" "}
            Repartidor
          </>
        ) : null}
      </p>
    </div>
  );
}
