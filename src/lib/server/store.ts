import postgres from "postgres";
import type { DeliveryAddress } from "@/lib/address";
import {
  canTransition,
  isFinalStatus,
  isOrderStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/order-status";

/**
 * Guarda los pedidos en la base de datos, para que el dueño y el repartidor
 * los vean desde sus propios celulares.
 * Si todavía no hay base de datos configurada (DATABASE_URL), usa una memoria
 * interna para poder probar todo en la compu. Al conectar la base de datos,
 * el mismo código funciona igual.
 */

export type StoredItem = {
  /** Clave del plato en el catálogo: "comercio:plato". */
  key?: string;
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
  customerName: string;
  customerPhone: string;
  notes: string | null;
  payment: "efectivo" | "transferencia";
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
      // Columnas agregadas después: para bases que ya existían.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment TEXT NOT NULL DEFAULT 'efectivo'`;
    })();
    // Si falla, que el próximo pedido lo vuelva a intentar.
    schemaReady.catch(() => {
      schemaReady = null;
    });
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
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  payment: string;
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
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    notes: row.notes ?? null,
    payment: row.payment === "transferencia" ? "transferencia" : "efectivo",
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: isOrderStatus(row.status) ? row.status : "recibido",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export type NewOrder = {
  id: string;
  merchantSlug: string;
  merchantName: string;
  items: StoredItem[];
  address: DeliveryAddress | null;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  payment: "efectivo" | "transferencia";
  subtotal: number;
  deliveryFee: number;
  total: number;
};

/**
 * Guarda el pedido. Si ya existe uno con ese id (por ejemplo, el cliente
 * reintentó), devuelve el que ya estaba, sin tocarlo.
 */
export async function createOrder(
  order: NewOrder,
): Promise<{ order: StoredOrder; created: boolean }> {
  const now = new Date().toISOString();
  const candidate: StoredOrder = {
    id: order.id,
    merchantSlug: order.merchantSlug,
    merchantName: order.merchantName,
    items: order.items,
    address: order.address,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    notes: order.notes,
    payment: order.payment,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    status: "recibido",
    createdAt: now,
    updatedAt: now,
  };

  if (!sql) {
    const existing = memory.orders.get(candidate.id);
    if (existing) return { order: existing, created: false };
    memory.orders.set(candidate.id, candidate);
    return { order: candidate, created: true };
  }

  await ensureSchema();
  const rows = (await sql`
    INSERT INTO orders (id, merchant_slug, merchant_name, items, address,
                        customer_name, customer_phone, notes, payment,
                        subtotal, delivery_fee, total, status)
    VALUES (${candidate.id}, ${candidate.merchantSlug}, ${candidate.merchantName},
            ${sql.json(candidate.items)}, ${candidate.address ? sql.json(candidate.address) : null},
            ${candidate.customerName}, ${candidate.customerPhone}, ${candidate.notes},
            ${candidate.payment}, ${candidate.subtotal}, ${candidate.deliveryFee},
            ${candidate.total}, 'recibido')
    ON CONFLICT (id) DO NOTHING
    RETURNING *`) as unknown as OrderRow[];
  if (rows.length) return { order: rowToOrder(rows[0]), created: true };

  const existing = (await sql`
    SELECT * FROM orders WHERE id = ${candidate.id}`) as unknown as OrderRow[];
  if (!existing.length) throw new Error("el pedido no se guardó ni existía");
  return { order: rowToOrder(existing[0]), created: false };
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

export type StatusUpdateResult =
  | { ok: true; order: StoredOrder }
  | { ok: false; reason: "not_found" | "invalid_transition"; current?: OrderStatus };

/** Cambia el estado, solo si la transición está permitida. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<StatusUpdateResult> {
  if (!sql) {
    const order = memory.orders.get(id);
    if (!order) return { ok: false, reason: "not_found" };
    if (!canTransition(order.status, status)) {
      return { ok: false, reason: "invalid_transition", current: order.status };
    }
    const updated = { ...order, status, updatedAt: new Date().toISOString() };
    memory.orders.set(id, updated);
    if (isFinalStatus(status)) memory.positions.delete(id);
    return { ok: true, order: updated };
  }

  await ensureSchema();
  // Los estados desde los que se puede llegar a este.
  const allowedFrom = ORDER_STATUSES.filter((from) => canTransition(from, status));
  const rows = (await sql`
    UPDATE orders SET status = ${status}, updated_at = now()
    WHERE id = ${id} AND status IN ${sql(allowedFrom)}
    RETURNING *`) as unknown as OrderRow[];
  if (rows.length) {
    if (isFinalStatus(status)) {
      await sql`DELETE FROM courier_positions WHERE order_id = ${id}`;
    }
    return { ok: true, order: rowToOrder(rows[0]) };
  }

  const current = (await sql`
    SELECT status FROM orders WHERE id = ${id}`) as unknown as { status: string }[];
  if (!current.length) return { ok: false, reason: "not_found" };
  return {
    ok: false,
    reason: "invalid_transition",
    current: isOrderStatus(current[0].status) ? current[0].status : "recibido",
  };
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
