/**
 * Configuración general de la app.
 * Cambiá estos valores y toda la app se actualiza.
 */
export const appConfig = {
  name: "Al Toque",
  city: "Villaguay",
  tagline: "Pedí a domicilio en Villaguay",
  /** Número de WhatsApp de atención, con código de país y sin espacios ni guiones. */
  whatsapp: "",
  deliveryFee: "$700",
  deliveryTime: "30-40 min",
  minOrder: "$3.500",
} as const;
