export const ORDER_STATUSES = [
  "recibido",
  "preparando",
  "en camino",
  "entregado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: "Recibido",
  preparando: "En preparación",
  "en camino": "En camino",
  entregado: "Entregado",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}
