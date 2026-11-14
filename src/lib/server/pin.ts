/**
 * El PIN compartido de piloto para el dueño y el repartidor.
 * Se configura con la variable de entorno OWNER_PIN. En desarrollo, si no
 * está configurada, se usa "4821" para poder probar en la compu.
 */
export function checkPin(request: Request): boolean {
  const expected =
    process.env.OWNER_PIN ??
    (process.env.NODE_ENV !== "production" ? "4821" : undefined);
  if (!expected) return false;
  return request.headers.get("x-altoque-pin") === expected;
}
