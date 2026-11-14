import { PageShell } from "@/components/page-shell";
import { CartView } from "./cart-view";

export const metadata = { title: "Tu carrito" };

export default function CartPage() {
  return (
    <PageShell title="Tu carrito" backHref="/">
      <CartView />
    </PageShell>
  );
}
