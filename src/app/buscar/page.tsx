import { Suspense } from "react";
import { PageShell } from "@/components/page-shell";
import { SearchClient } from "./search-client";

export const metadata = { title: "Buscar" };

export default function SearchPage() {
  return (
    <PageShell title="Buscar">
      <Suspense
        fallback={<p className="py-10 text-center text-[13px] text-muted">Cargando…</p>}
      >
        <SearchClient />
      </Suspense>
    </PageShell>
  );
}
