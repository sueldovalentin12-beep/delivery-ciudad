import { storageAvailable, createOrder, listOrders } from "@/lib/server/store";
import type { StoredItem } from "@/lib/server/store";
import { checkPin } from "@/lib/server/pin";
import { findMenuItem, formatPrice, type Merchant } from "@/lib/demo-data";
import { isOpenAt, nextChange, whenLong } from "@/lib/hours";
import { itemPrice } from "@/lib/pricing";
import type { DeliveryAddress } from "@/lib/address";

function bad(error: string) {
  return Response.json({ error }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * POST /api/orders: el cliente confirma su pedido.
 * El servidor no confía en los precios del celular: los recalcula
 * desde el catálogo.
 */
export async function POST(request: Request) {
  if (!storageAvailable()) {
    return Response.json(
      { error: "Falta conectar la base de datos (DATABASE_URL)." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("No pudimos leer el pedido. Probá de nuevo.");
  }
  if (!isRecord(body)) return bad("No pudimos leer el pedido. Probá de nuevo.");

  // Número de pedido
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (id.length < 5 || id.length > 40 || !/^[A-Za-z0-9-]+$/.test(id)) {
    return bad("El número de pedido no es válido. Probá de nuevo.");
  }

  // Platos
  if (!Array.isArray(body.items) || body.items.length < 1) {
    return bad("Tu pedido está vacío.");
  }
  if (body.items.length > 40) {
    return bad("El pedido tiene demasiados productos.");
  }
  const quantities = new Map<string, number>();
  for (const raw of body.items) {
    const entry = isRecord(raw) ? raw : {};
    const key = typeof entry.key === "string" ? entry.key : "";
    const qty = entry.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return bad("La cantidad de cada producto tiene que ser entre 1 y 99.");
    }
    quantities.set(key, Math.min(99, (quantities.get(key) ?? 0) + qty));
  }

  let merchant: Merchant | null = null;
  const items: StoredItem[] = [];
  for (const [key, qty] of quantities) {
    const colon = key.indexOf(":");
    const found =
      colon > 0 ? findMenuItem(key.slice(0, colon), key.slice(colon + 1)) : undefined;
    if (!found) {
      return bad("Hay un producto que ya no está disponible. Revisá tu carrito.");
    }
    if (merchant && merchant.slug !== found.merchant.slug) {
      return bad("Un pedido puede tener productos de un solo comercio.");
    }
    merchant = found.merchant;
    items.push({
      key,
      name: found.item.name,
      qty,
      price: itemPrice(found.item).final,
      emoji: found.item.emoji,
      merchantName: found.merchant.name,
      merchantSlug: found.merchant.slug,
    });
  }
  if (!merchant) return bad("Tu pedido está vacío.");

  // El comercio tiene que estar abierto ahora (hora de Argentina, ver lib/hours).
  const now = new Date();
  if (!isOpenAt(merchant, now)) {
    const change = nextChange(merchant, now);
    return bad(
      `${merchant.name} está cerrado ahora.${change ? ` Abre ${whenLong(change)}.` : ""}`,
    );
  }

  // Dirección
  const rawAddress = isRecord(body.address) ? body.address : {};
  const street =
    typeof rawAddress.street === "string" ? rawAddress.street.trim() : "";
  if (street.length < 3 || street.length > 200) {
    return bad("Escribí tu dirección de entrega (calle y número).");
  }
  const reference =
    typeof rawAddress.reference === "string" ? rawAddress.reference.trim() : "";
  if (reference.length > 200) {
    return bad("La referencia de la dirección es muy larga.");
  }
  const address: DeliveryAddress = { street };
  if (reference) address.reference = reference;
  const { lat, lng } = rawAddress;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    address.lat = lat;
    address.lng = lng;
  }

  // Datos del cliente
  const customer = isRecord(body.customer) ? body.customer : {};
  const customerName =
    typeof customer.name === "string" ? customer.name.trim() : "";
  if (customerName.length < 2 || customerName.length > 80) {
    return bad("Escribí tu nombre para que el comercio sepa a quién entregar.");
  }
  const customerPhone =
    typeof customer.phone === "string" ? customer.phone.trim() : "";
  const digits = customerPhone.replace(/\D/g, "").length;
  if (digits < 6 || digits > 15 || customerPhone.length > 30) {
    return bad("Escribí un teléfono válido para poder avisarte.");
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes.length > 300) {
    return bad("La nota del pedido es muy larga (máximo 300 letras).");
  }
  const payment = body.payment === "transferencia" ? "transferencia" : "efectivo";

  // Totales, siempre calculados acá
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (subtotal < merchant.minOrderValue) {
    return bad(
      `El pedido mínimo en ${merchant.name} es ${formatPrice(merchant.minOrderValue)}.`,
    );
  }
  const deliveryFee = merchant.deliveryFeeValue;
  const total = subtotal + deliveryFee;

  try {
    const { order, created } = await createOrder({
      id,
      merchantSlug: merchant.slug,
      merchantName: merchant.name,
      items,
      address,
      customerName,
      customerPhone,
      notes: notes || null,
      payment,
      subtotal,
      deliveryFee,
      total,
    });
    return Response.json(
      {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
      },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("No se pudo guardar el pedido", error);
    return Response.json(
      { error: "No se pudo guardar el pedido. Probá de nuevo." },
      { status: 500 },
    );
  }
}

/** GET /api/orders: lista para el dueño y el repartidor (con PIN). */
export async function GET(request: Request) {
  if (!checkPin(request)) {
    return Response.json({ error: "PIN incorrecto" }, { status: 401 });
  }
  if (!storageAvailable()) {
    return Response.json(
      { error: "Falta conectar la base de datos (DATABASE_URL)." },
      { status: 503 },
    );
  }
  try {
    const orders = await listOrders();
    return Response.json({ orders });
  } catch (error) {
    console.error("No se pudieron leer los pedidos", error);
    return Response.json(
      { error: "No se pudieron cargar los pedidos. Probá de nuevo." },
      { status: 500 },
    );
  }
}
