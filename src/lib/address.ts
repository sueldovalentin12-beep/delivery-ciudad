/**
 * Dirección de entrega.
 * Vive en el celular del cliente (localStorage) para no pedirla en cada
 * pedido; al confirmar viaja con el pedido a la base de datos.
 */

export type DeliveryAddress = {
  /** Calle y número. Ej: "Urquiza 1234". */
  street: string;
  /** Referencias opcionales: entre calles, piso, color de casa, etc. */
  reference?: string;
  /** Ubicación del GPS del celular, si la persona la compartió. */
  lat?: number;
  lng?: number;
};

const STORAGE_KEY = "altoque.address.v1";

export function readAddress(): DeliveryAddress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as DeliveryAddress).street !== "string" ||
      (parsed as DeliveryAddress).street.length === 0
    ) {
      return null;
    }
    return parsed as DeliveryAddress;
  } catch {
    return null;
  }
}

export function saveAddress(address: DeliveryAddress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
  } catch {
    // Modo incógnito o sin espacio: la dirección vive solo en memoria.
  }
}

/** Texto corto para mostrar: dirección + referencia. */
export function addressLabel(address: DeliveryAddress): string {
  const clean = address.street.trim();
  const reference = address.reference?.trim();
  return reference ? `${clean} · ${reference}` : clean;
}

/** Link de Google Maps con el pin exacto, si hay ubicación. */
export function mapsUrl(address: DeliveryAddress): string | null {
  if (typeof address.lat !== "number" || typeof address.lng !== "number") {
    return null;
  }
  return `https://www.google.com/maps?q=${address.lat.toFixed(5)},${address.lng.toFixed(5)}`;
}

/** Mini mapa de OpenStreetMap para confirmar que el pin quedó bien puesto. */
export function mapPreviewUrl(address: DeliveryAddress): string | null {
  if (typeof address.lat !== "number" || typeof address.lng !== "number") {
    return null;
  }
  const { lat, lng } = address;
  const minLat = (lat - 0.0015).toFixed(5);
  const maxLat = (lat + 0.0015).toFixed(5);
  const minLng = (lng - 0.0025).toFixed(5);
  const maxLng = (lng + 0.0025).toFixed(5);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`;
}
