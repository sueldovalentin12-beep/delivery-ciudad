import postgres from "postgres";
import type { DeliveryAddress } from "@/lib/address";
import { isOrderStatus, type OrderStatus } from "@/lib/order-status";

/**
 * Guarda los pedidos en la base de datos, para que el dueño y el repartidor
 * los vean desde sus propios celulares.
 * Si todavía no hay base de datos configurada (DATABASE_URL), usa una memoria
 * interna para poder probar todo en la compu. Al conectar la base de datos,
 * el mismo código funciona igual.
 */

export type StoredItem = {
  name: string;
  qty: number;
  price: number;
  emoji?: string;
  merchantName?: string;
  merchantSlug?: string;
};

export type StoredOrder = {
  id: string;
  merchantSlug: string;
  merchantName: string;
  items: StoredItem[];
  address: DeliveryAddress | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type CourierPosition = { lat: number; lng: number; at: string };

const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { max: 5, ssl: "require" })
  : null;

/** La memoria de reserva, para probar sin base de datos. */
const memory = {
  orders: new Map<string, StoredOrder>(),
  positions: new Map<string, CourierPosition>(),
};

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          merchant_slug TEXT NOT NULL,
          merchant_name TEXT NOT NULL,
          items JSONB NOT NULL,
          address JSONB,
          subtotal INTEGER NOT NULL,
          delivery_fee INTEGER NOT NULL,
          total INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'recibido',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS courier_positions (
          order_id TEXT PRIMARY KEY,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
    })();
  }
  await schemaReady;
}

export function dbConfigured(): boolean {
  return Boolean(sql);
}

/**
 * ¿Se pueden guardar pedidos ahora?
 * En producción (Vercel) exige la base de datos para no perder pedidos.
 * En la compu, sin base de datos, usa la memoria interna para poder probar.
 */
export function storageAvailable(): boolean {
  return Boolean(sql) || process.env.NODE_ENV !== "production";
}

/** Forma de una fila de la tabla orders tal como viene de la base. */
type OrderRow = {
  id: string;
  merchant_slug: string;
  merchant_name: string;
  items: unknown;
  address: unknown;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function rowToOrder(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    merchantSlug: row.merchant_slug,
    merchantName: row.merchant_name,
    items: Array.isArray(row.items) ? (row.items as StoredItem[]) : [],
    address: (row.address as DeliveryAddress) ?? null,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: isOrderStatus(row.status) ? row.status : "recibido",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export type NewOrder = {
  id?: string;
  items: StoredItem[];
  address: DeliveryAddress | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

/** Guarda el pedido. Devuelve el id definitivo (únicos: si choca, agrega un sufijo). */
export async function createOrder(order: NewOrder): Promise<StoredOrder> {
  const baseId = order.id?.trim() || `AT-${Date.now().toString(36)}`;
  const items = order.items;
  const first = items[0]?.merchantName ?? "Comercio";
  const slug = items[0]?.merchantSlug ?? "";

  const now = new Date();
  const candidate: StoredOrder = {
    id: baseId,
    merchantSlug: slug,
    merchantName: first,
    items,
    address: order.address,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    status: "recibido",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (!sql) {
    // Reserva en memoria: si ya existe el id, agrega un sufijo.
    let id = candidate.id;
    let attempt = 1;
    while (memory.orders.has(id)) {
      attempt += 1;
      id = `${baseId}-${attempt}`;
    }
    memory.orders.set(id, { ...candidate, id });
    return { ...candidate, id };
  }

  await ensureSchema();
  let id = candidate.id;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const rows = await sql`
        INSERT INTO orders (id, merchant_slug, merchant_name, items, address, subtotal, delivery_fee, total, status)
        VALUES (${id}, ${candidate.merchantSlug}, ${candidate.merchantName},
                ${sql.json(items)}, ${candidate.address ? sql.json(candidate.address) : null},
                ${candidate.subtotal}, ${candidate.deliveryFee}, ${candidate.total}, 'recibido')
        RETURNING *`;
      return rowToOrder(rows[0] as unknown as OrderRow);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("duplicate key") || message.includes("unique")) {
        attempt += 1;
        id = `${baseId}-${attempt}`;
        continue;
      }
      throw error;
    }
  }
  throw new Error("no se pudo generar un id único para el pedido");
}

export async function listOrders(): Promise<StoredOrder[]> {
  if (!sql) {
    return [...memory.orders.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`) as unknown as OrderRow[];
  return rows.map(rowToOrder);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  if (!sql) return memory.orders.get(id) ?? null;
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE id = ${id}`) as unknown as OrderRow[];
  return rows.length ? rowToOrder(rows[0]) : null;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<StoredOrder | null> {
  if (!sql) {
    const order = memory.orders.get(id);
    if (!order) return null;
    const updated = { ...order, status, updatedAt: new Date().toISOString() };
    memory.orders.set(id, updated);
    return updated;
  }
  await ensureSchema();
  const rows = (await sql`
    UPDATE orders SET status = ${status}, updated_at = now()
    WHERE id = ${id}
    RETURNING *`) as unknown as OrderRow[];
  return rows.length ? rowToOrder(rows[0]) : null;
}

export async function saveCourierPosition(
  orderId: string,
  lat: number,
  lng: number,
): Promise<void> {
  const position: CourierPosition = {
    lat,
    lng,
    at: new Date().toISOString(),
  };
  if (!sql) {
    memory.positions.set(orderId, position);
    return;
  }
  await ensureSchema();
  await sql`
    INSERT INTO courier_positions (order_id, lat, lng, at)
    VALUES (${orderId}, ${lat}, ${lng}, now())
    ON CONFLICT (order_id)
    DO UPDATE SET lat = ${lat}, lng = ${lng}, at = now()`;
}

export async function getCourierPosition(
  orderId: string,
): Promise<CourierPosition | null> {
  if (!sql) return memory.positions.get(orderId) ?? null;
  await ensureSchema();
  const rows = await sql`
    SELECT lat, lng, at FROM courier_positions WHERE order_id = ${orderId}`;
  return rows.length
    ? {
        lat: Number(rows[0].lat),
        lng: Number(rows[0].lng),
        at: new Date(rows[0].at).toISOString(),
      }
    : null;
}
