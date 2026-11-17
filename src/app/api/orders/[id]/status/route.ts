import { storageAvailable, updateOrderStatus } from "@/lib/server/store";
import { checkPin } from "@/lib/server/pin";
import { isOrderStatus, STATUS_LABEL } from "@/lib/order-status";

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

  const status = (body as { status?: unknown } | null)?.status;
  if (!isOrderStatus(status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    const result = await updateOrderStatus(id, status);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
      }
      const current = result.current ?? "recibido";
      return Response.json(
        {
          error: `El pedido ya está en estado «${STATUS_LABEL[current]}»: no se puede pasar a «${STATUS_LABEL[status]}».`,
          status: current,
        },
        { status: 409 },
      );
    }
    return Response.json({ id: result.order.id, status: result.order.status });
  } catch (error) {
    console.error("No se pudo cambiar el estado", error);
    return Response.json(
      { error: "No se pudo cambiar el estado. Probá de nuevo." },
      { status: 500 },
    );
  }
}
