import { storageAvailable, getOrder, getCourierPosition } from "@/lib/server/store";

/**
 * GET /api/orders/[id]: el cliente consulta el estado de su pedido
 * y la última ubicación del repartidor (solo mientras va en camino).
 * No devuelve datos del cliente.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!storageAvailable()) {
    return Response.json(
      { error: "Falta conectar la base de datos (DATABASE_URL)." },
      { status: 503 },
    );
  }
  try {
    const order = await getOrder(id);
    if (!order) {
      return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    const position =
      order.status === "en camino" ? await getCourierPosition(id) : null;
    return Response.json({
      id: order.id,
      status: order.status,
      updatedAt: order.updatedAt,
      position,
    });
  } catch (error) {
    console.error("No se pudo leer el pedido", error);
    return Response.json(
      { error: "No se pudo consultar el pedido. Probá de nuevo." },
      { status: 500 },
    );
  }
}
