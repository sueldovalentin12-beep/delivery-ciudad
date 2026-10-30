/**
 * Configuración general de la app.
 * Cambiá estos valores y toda la app se actualiza.
 */
export const appConfig = {
  name: "Delivery",
  city: "Tu Ciudad",
  tagline: "Pedí a domicilio en tu ciudad",
  /** Número de WhatsApp de atención, con código de país y sin espacios ni guiones. */
  whatsapp: "",
  deliveryFee: "$700",
  deliveryTime: "30-40 min",
} as const;
