import { storageAvailable, updateOrderStatus } from "@/lib/server/store";
import { checkPin } from "@/lib/server/pin";
import { isOrderStatus } from "@/lib/order-status";

/** POST /api/orders/[id]/status: el dueño o el repartidor cambian el estado. */
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

  const status = (body as { status?: unknown }).status;
  if (!isOrderStatus(status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }

  const updated = await updateOrderStatus(id, status);
  if (!updated) {
    return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  return Response.json({ id: updated.id, status: updated.status });
}
