export const ORDER_STATUSES = [
  "recibido",
  "preparando",
  "en camino",
  "entregado",
  "cancelado",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: "Recibido",
  preparando: "En preparación",
  "en camino": "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

/** Un pedido entregado o cancelado ya no cambia más. */
export function isFinalStatus(status: OrderStatus): boolean {
  return status === "entregado" || status === "cancelado";
}

const NEXT_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  recibido: ["preparando", "cancelado"],
  preparando: ["en camino", "cancelado"],
  "en camino": ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

/** ¿Se puede pasar de un estado a otro? */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}

