import type { Metadata } from "next";
import { RepartidorClient } from "./repartidor-client";

/** Pantalla interna del piloto: no se indexa en buscadores. */
export const metadata: Metadata = {
  title: "Panel del repartidor · Al Toque",
  robots: { index: false, follow: false },
};

export default function RepartidorPage() {
  return <RepartidorClient />;
}
