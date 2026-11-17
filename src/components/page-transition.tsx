import { ViewTransition, type ReactNode } from "react";

/**
 * Cruce suave entre pantallas (React <ViewTransition>, activado por la
 * navegación de Next). Va dentro de cada page, no en el layout: los layouts
 * no se desmontan, así que ahí nunca se dispararía la entrada ni la salida.
 * Los links de "volver" usan transitionTypes={["nav-back"]} para deslizar al
 * revés; el menú de abajo y los encabezados tienen su propio
 * view-transition-name y quedan quietos.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-back": "page-back", default: "page-forward" }}
      exit={{ "nav-back": "page-back", default: "page-forward" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
