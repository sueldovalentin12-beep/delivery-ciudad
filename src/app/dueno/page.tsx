import type { Metadata } from "next";
import { DuenoClient } from "./dueno-client";

/** Pantalla interna del piloto: no se indexa en buscadores. */
export const metadata: Metadata = {
  title: "Panel del dueño",
  robots: { index: false, follow: false },
};

export default function DuenoPage() {
  return <DuenoClient />;
}
