import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/**
 * Ficha de instalación de la app (PWA).
 * Es lo que lee el celular cuando la persona toca "Agregar a pantalla de inicio".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appConfig.name} · Delivery ${appConfig.city}`,
    short_name: appConfig.name,
    description: `${appConfig.tagline}. Comida a domicilio en ${appConfig.city}, con envío en ${appConfig.deliveryTime}.`,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    background_color: "#ffffff",
    theme_color: "#56c232",
    categories: ["food", "shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
