import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { TrackingSkeleton, TrackingView } from "./tracking-view";

export const metadata = { title: "Seguí tu pedido" };

export default function TrackingPage({ params }: PageProps<"/pedidos/[id]">) {
  return (
    <PageTransition>
      <Suspense fallback={<TrackingSkeleton />}>
        <TrackingContent params={params} />
      </Suspense>
    </PageTransition>
  );
}

/** El número de pedido llega por la URL; el pedido en sí vive en el celular. */
async function TrackingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackingView id={decodeURIComponent(id)} />;
}
