/**
 * Configuración general de la app.
 * Cambiá estos valores y toda la app se actualiza.
 * El envío y el pedido mínimo son de cada comercio (ver demo-data).
 */
export const appConfig = {
  name: "Al Toque",
  city: "Villaguay",
  tagline: "Pedí a domicilio en Villaguay",
  /** Número de WhatsApp de atención, con código de país y sin espacios ni guiones. */
  whatsapp: "5493455485277",
  deliveryTime: "30-40 min",
  /** Zona horaria de los comercios: los horarios de apertura se leen siempre en esta hora. */
  timeZone: "America/Argentina/Buenos_Aires",
} as const;
