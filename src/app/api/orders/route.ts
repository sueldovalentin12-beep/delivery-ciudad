import { storageAvailable, createOrder, listOrders } from "@/lib/server/store";
import { checkPin } from "@/lib/server/pin";

/** POST /api/orders: el cliente guarda su pedido reciÃ©n confirmado. */
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
    return Response.json({ error: "JSON invÃ¡lido" }, { status: 400 });
  }

  const data = body as {
    id?: string;
    items?: unknown;
    address?: unknown;
    subtotal?: unknown;
    deliveryFee?: unknown;
    total?: unknown;
  };

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return Response.json({ error: "Pedido sin platos" }, { status: 400 });
  }

  const items = data.items.map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      name: String(entry.name ?? "").slice(0, 120),
      qty: Math.max(1, Math.min(99, Number(entry.qty) || 1)),
      price: Math.max(0, Number(entry.price) || 0),
      emoji: typeof entry.emoji === "string" ? entry.emoji.slice(0, 8) : undefined,
      merchantName:
        typeof entry.merchantName === "string"
          ? entry.merchantName.slice(0, 120)
          : undefined,
      merchantSlug:
        typeof entry.merchantSlug === "string"
          ? entry.merchantSlug.slice(0, 120)
          : undefined,
    };
  });

  const address =
    data.address && typeof data.address === "object"
      ? (data.address as {
          street?: unknown;
          reference?: unknown;
          lat?: unknown;
          lng?: unknown;
        })
      : null;
  const cleanAddress =
    address && typeof address.street === "string" && address.street.trim().length >= 3
      ? {
          street: address.street.slice(0, 200),
          reference:
            typeof address.reference === "string" && address.reference.trim()
              ? address.reference.slice(0, 200)
              : undefined,
          lat: typeof address.lat === "number" ? address.lat : undefined,
          lng: typeof address.lng === "number" ? address.lng : undefined,
        }
      : null;

  const order = await createOrder({
    id: typeof data.id === "string" ? data.id : undefined,
    items,
    address: cleanAddress,
    subtotal: Math.max(0, Number(data.subtotal) || 0),
    deliveryFee: Math.max(0, Number(data.deliveryFee) || 0),
    total: Math.max(0, Number(data.total) || 0),
  });

  return Response.json({ id: order.id }, { status: 201 });
}

/** GET /api/orders: lista para el dueÃ±o y el repartidor (con PIN). */
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
  const orders = await listOrders();
  return Response.json({ orders });
}
