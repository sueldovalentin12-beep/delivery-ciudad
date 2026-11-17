/**
 * Datos de contacto del cliente.
 * Viven en el celular (localStorage) para no pedirlos en cada pedido; al
 * confirmar viajan con el pedido para que el comercio y el repartidor
 * puedan avisarle.
 */

export type Customer = {
  name: string;
  phone: string;
};

const STORAGE_KEY = "altoque.customer.v1";

export function readCustomer(): Customer | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Customer).name !== "string" ||
      typeof (parsed as Customer).phone !== "string"
    ) {
      return null;
    }
    return {
      name: (parsed as Customer).name,
      phone: (parsed as Customer).phone,
    };
  } catch {
    return null;
  }
}

export function saveCustomer(customer: Customer): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
  } catch {
    // Modo incógnito o sin espacio: los datos viven solo en memoria.
  }
}

/** El nombre sirve si tiene entre 2 y 80 letras (sin contar espacios de las puntas). */
export function isValidName(name: string): boolean {
  const length = name.trim().length;
  return length >= 2 && length <= 80;
}

/** El teléfono sirve si tiene entre 6 y 15 dígitos. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15;
}
