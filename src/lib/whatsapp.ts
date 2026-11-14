import { appConfig } from "@/lib/config";
import { addressLabel, mapsUrl } from "@/lib/address";
import { formatPrice } from "@/lib/demo-data";
import type { Order } from "@/lib/orders";

/**
 * Aviso del pedido por WhatsApp.
 * El cliente confirma en la app, y se le abre WhatsApp con el pedido
 * ya escrito, dirigido al número del comercio: solo tiene que apretar enviar.
 * Es la etapa piloto; en la Etapa 4 el pedido viaja directo a la base de datos.
 */

export function buildOrderMessage(order: Order): string {
  // Agrupa los platos por comercio (el carrito puede tener más de uno).
  const byMerchant = new Map<string, string[]>();
  for (const item of order.items) {
    const line = `${item.qty} × ${item.name} — ${formatPrice(item.price * item.qty)}`;
    const lines = byMerchant.get(item.merchantName) ?? [];
    lines.push(line);
    byMerchant.set(item.merchantName, lines);
  }

  const groups = [...byMerchant.entries()]
    .map(
      ([merchant, lines]) =>
        `*${merchant}*\n${lines.join("\n")}`,
    )
    .join("\n\n");

  const lines = [
    `🛵 *Pedido ${appConfig.name}* · Nº ${order.id}`,
    "",
    groups,
  ];

  if (order.address) {
    lines.push("", `📍 *Entrega:* ${addressLabel(order.address)}`);
    const url = mapsUrl(order.address);
    if (url) lines.push(url);
  }

  lines.push(
    "",
    `*Envío:* ${formatPrice(order.deliveryFee)}`,
    `*Total:* ${formatPrice(order.total)}`,
  );

  return lines.join("\n");
}

/** Link de WhatsApp para avisar al comercio. null si no hay número configurado. */
export function merchantWhatsAppUrl(order: Order): string | null {
  const number = appConfig.whatsapp.replace(/\D/g, "");
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(buildOrderMessage(order))}`;
}
