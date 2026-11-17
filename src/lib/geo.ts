/** Cuentas de distancia y tiempo para el seguimiento del pedido. */

export type LatLng = { lat: number; lng: number };

/** Distancia en metros entre dos puntos (fórmula de haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "850 m" o "1,4 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Minutos estimados yendo a 20 km/h (mínimo 1). */
export function etaMinutes(meters: number, kmh = 20): number {
  return Math.max(1, Math.round(meters / ((kmh * 1000) / 60)));
}
