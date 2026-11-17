import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";

/**
 * Marco común de las pantallas internas: encabezado fijo y contenido.
 * El menú de abajo ya no está acá: vive en el layout para no desmontarse.
 */
export function PageShell({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <PageTransition>
      <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-20">
        <header
          style={{ viewTransitionName: "page-header" }}
          className="sticky top-0 z-20 border-b border-line bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur"
        >
          <div className="flex h-14 items-center gap-2 px-3">
            {backHref ? (
              <Link
                href={backHref}
                transitionTypes={["nav-back"]}
                aria-label="Volver"
                className="grid h-9 w-9 place-items-center rounded-full text-foreground"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
            ) : null}
            <h1 className="text-[15px] font-bold tracking-tight text-foreground">{title}</h1>
          </div>
        </header>

        <main className="px-4 py-4">{children}</main>
      </div>
    </PageTransition>
  );
}
