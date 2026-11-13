import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/page-shell";

export const metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <PageShell title="Tu carrito" backHref="/">
      <EmptyState
        emoji="🛒"
        title="Tu carrito está vacío"
        description="Elegí un comercio y agregá algo rico. En la próxima etapa va a poder confirmar el pedido desde acá."
      />
    </PageShell>
  );
}
