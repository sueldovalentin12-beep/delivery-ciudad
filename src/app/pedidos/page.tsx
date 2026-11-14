import { PageShell } from "@/components/page-shell";
import { OrdersView } from "./orders-view";

export const metadata = { title: "Mis pedidos" };

export default function OrdersPage() {
  return (
    <PageShell title="Mis pedidos">
      <OrdersView />
    </PageShell>
  );
}
