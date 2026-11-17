"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HomeIcon, ReceiptIcon, SearchIcon, StoreIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/comercios", label: "Comercios", icon: StoreIcon },
  { href: "/buscar", label: "Buscar", icon: SearchIcon },
  { href: "/pedidos", label: "Pedidos", icon: ReceiptIcon },
  { href: "/perfil", label: "Perfil", icon: UserIcon },
];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Menú de abajo. Vive en el layout: no se desmonta al navegar, así que no
 * parpadea; la rayita de arriba se desliza de una pestaña a la otra.
 * En el seguimiento de un pedido (/pedidos/{id}) se esconde hacia abajo para
 * dejar la pantalla grande al mapa.
 */
export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = items.findIndex((item) => isActive(item.href, pathname));
  // La rayita se acuerda de la última pestaña: en una pantalla sin pestaña (el
  // comercio, el carrito) se desvanece donde estaba en vez de saltar.
  const [lastIndex, setLastIndex] = useState(Math.max(activeIndex, 0));
  if (activeIndex !== -1 && activeIndex !== lastIndex) setLastIndex(activeIndex);

  const immersive = /^\/pedidos\/[^/]+$/.test(pathname);

  return (
    <nav
      aria-label="Menú principal"
      aria-hidden={immersive || undefined}
      inert={immersive}
      style={{ viewTransitionName: "bottom-nav" }}
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out ${
        immersive ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <ul className="relative mx-auto flex h-[60px] w-full max-w-md items-stretch">
        <li
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 h-[3px] w-1/5 transition-[transform,opacity] duration-300 ease-out ${
            activeIndex === -1 ? "opacity-0" : "opacity-100"
          }`}
          style={{ transform: `translateX(${lastIndex * 100}%)` }}
        >
          <span className="mx-auto block h-full w-9 rounded-b-full bg-brand" />
        </li>
        {items.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-brand" : "text-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`transition-transform duration-300 ease-out ${
                    active ? "-translate-y-px scale-110" : ""
                  }`}
                >
                  <Icon />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
