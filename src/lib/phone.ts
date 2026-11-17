/**
 * Teléfonos de clientes: links para llamar y para escribir por WhatsApp.
 */

/** Solo los números del teléfono. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Número listo para wa.me (formato internacional de celular argentino:
 * 549 + código de área + número, sin 0 ni 15).
 * - Si ya viene con 549 o 54, se respeta (agregando el 9 si falta).
 * - Si es local: se saca el 0 inicial y el "15" del medio, y se pone 549.
 * - Si es muy corto para saber el código de área, queda como está.
 */
export function whatsappDigits(phone: string): string {
  let digits = phoneDigits(phone).replace(/^00/, "");
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54") && digits.length === 12) return `549${digits.slice(2)}`;
  if (digits.startsWith("54")) return digits;
  digits = digits.replace(/^0/, "");
  if (digits.length === 12) {
    // Código de área (2 a 4 dígitos) + 15 + número: sacamos el 15.
    for (const areaLength of [2, 3, 4]) {
      if (digits.slice(areaLength, areaLength + 2) === "15") {
        digits = digits.slice(0, areaLength) + digits.slice(areaLength + 2);
        break;
      }
    }
  }
  return digits.length === 10 ? `549${digits}` : digits;
}

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${whatsappDigits(phone)}`;
}
