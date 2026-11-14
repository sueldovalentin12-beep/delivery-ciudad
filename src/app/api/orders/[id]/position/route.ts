import { storageAvailable, saveCourierPosition } from "@/lib/server/store";
import { checkPin } from "@/lib/server/pin";

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

  const data = body as { lat?: unknown; lng?: unknown };
  const lat = Number(data.lat);
  const lng = Number(data.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "Ubicación inválida" }, { status: 400 });
  }

  await saveCourierPosition(id, lat, lng);
  return Response.json({ ok: true });
}
