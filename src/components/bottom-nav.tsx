"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ReceiptIcon, SearchIcon, StoreIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/comercios", label: "Comercios", icon: StoreIcon },
  { href: "/buscar", label: "Buscar", icon: SearchIcon },
  { href: "/pedidos", label: "Pedidos", icon: ReceiptIcon },
  { href: "/perfil", label: "Perfil", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-[60px] w-full max-w-md items-stretch">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-brand" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
