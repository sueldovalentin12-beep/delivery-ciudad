import { storageAvailable, getOrder, getCourierPosition } from "@/lib/server/store";

/**
 * GET /api/orders/[id]: el cliente consulta el estado de su pedido
 * y la última ubicación del repartidor, si la está compartiendo.
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
  const order = await getOrder(id);
  if (!order) {
    return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  const position = await getCourierPosition(id);
  return Response.json({
    id: order.id,
    status: order.status,
    updatedAt: order.updatedAt,
    position: position,
  });
}
