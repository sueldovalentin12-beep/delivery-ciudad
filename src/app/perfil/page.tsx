import { PageShell } from "@/components/page-shell";
import { ClearOrdersButton } from "./clear-orders-button";

export const metadata = { title: "Perfil" };

export default function ProfilePage() {
  return (
    <PageShell title="Mi perfil">
      <div className="space-y-3">
        <p className="text-[13px] text-muted">
          Para el piloto, el dueño y el repartidor entran a sus paneles acá.
          Después de la prueba se van a mover a sus propias apps.
        </p>
        <a
          href="/dueno"
          className="block rounded-2xl border border-line bg-white p-4"
        >
          <p className="text-[14px] font-bold text-foreground">
            🏪 Panel del dueño
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            Ver los pedidos que entran y pasarlos de estado. Pide el PIN del
            comercio.
          </p>
        </a>
        <a
          href="/repartidor"
          className="block rounded-2xl border border-line bg-white p-4"
        >
          <p className="text-[14px] font-bold text-foreground">
            🛵 Panel del repartidor
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            Pedidos a entregar y botón para compartir tu ubicación con el
            cliente. Pide tu PIN.
          </p>
        </a>
        <ClearOrdersButton />
      </div>
    </PageShell>
  );
}
