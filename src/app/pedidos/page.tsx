import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Pedidos" };

export default function OrdersPage() {
  return (
    <PageShell title="Mis pedidos">
      <EmptyState
        emoji="🧾"
        title="Todavía no hiciste pedidos"
        description="Cuando pidas algo, acá vas a poder seguir el estado en tiempo real."
      />
    </PageShell>
  );
}
