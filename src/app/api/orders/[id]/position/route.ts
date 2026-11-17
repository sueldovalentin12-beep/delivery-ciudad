import {
  storageAvailable,
  saveCourierPosition,
  getOrder,
} from "@/lib/server/store";
import { checkPin } from "@/lib/server/pin";
import { isFinalStatus } from "@/lib/order-status";

/** POST /api/orders/[id]/position: el repartidor comparte dónde está. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!checkPin(request)) {
    return Response.json({ error: "PIN incorrecto" }, { status: 401 });
  }
  if (!storageAvailable()) {
    return Response.json(
      { error: "Falta conectar la base de datos (DATABASE_URL)." },
      { status: 503 },
    );
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data = (body ?? {}) as { lat?: unknown; lng?: unknown };
  const lat = typeof data.lat === "number" ? data.lat : NaN;
  const lng = typeof data.lng === "number" ? data.lng : NaN;
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return Response.json({ error: "Ubicación inválida" }, { status: 400 });
  }

  try {
    const order = await getOrder(id);
    if (!order) {
      return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (isFinalStatus(order.status)) {
      return Response.json(
        { error: "El pedido ya terminó: no se comparte más la ubicación." },
        { status: 409 },
      );
    }
    await saveCourierPosition(id, lat, lng);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("No se pudo guardar la ubicación", error);
    return Response.json(
      { error: "No se pudo guardar la ubicación. Probá de nuevo." },
      { status: 500 },
    );
  }
}
