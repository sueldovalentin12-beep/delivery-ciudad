import Link from "next/link";
import { ActiveOrderBanner } from "@/components/active-order-banner";
import { CartBadge } from "@/components/cart-badge";
import { CategoryTile } from "@/components/category-tile";
import { PageTransition } from "@/components/page-transition";
import { HeroCarousel } from "@/components/hero-carousel";
import { ChevronRightIcon, SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { MotoIcon } from "@/components/moto-icon";
import { OpenNowList } from "@/components/open-now-list";
import { SectionHeader } from "@/components/section-header";
import { VendorCard } from "@/components/vendor-card";
import { appConfig } from "@/lib/config";
import {
  categories,
  formatPrice,
  heroSlides,
  merchants,
} from "@/lib/demo-data";

/** El envío más barato del catálogo, para el "desde" del pie. */
const minDeliveryFee = Math.min(...merchants.map((m) => m.deliveryFeeValue));

export default function Home() {
  return (
    <PageTransition>
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-20">
      <header
        style={{ viewTransitionName: "page-header" }}
        className="sticky top-0 z-20 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Logo />

          <CartBadge />
        </div>
      </header>

      <ActiveOrderBanner />

      <main className="space-y-6 pt-1">
        {/* Parece un campo de texto, pero es un link: la búsqueda de verdad vive en /buscar. */}
        <div className="px-4">
          <Link
            href="/buscar"
            className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 text-[14px] text-muted"
          >
            <SearchIcon className="h-4.5 w-4.5 shrink-0" />
            ¿Qué querés comer hoy?
          </Link>
        </div>

        <HeroCarousel slides={heroSlides} />

        <section className="-mx-0">
          <SectionHeader title="¿Qué se te antoja?" />
          <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryTile category={category} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeader title="Popular ahora" href="/comercios" />
          <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
            {merchants.map((merchant) => (
              <li key={merchant.id}>
                <VendorCard merchant={merchant} />
              </li>
            ))}
          </ul>
        </section>

        <section className="px-4">
          <Link
            href="/sumate"
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl">
              🏪
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">
                ¿Tenés un local en {appConfig.city}?
              </p>
              <p className="text-[11.5px] text-muted">
                Sumate a Al Toque y vendé sin invertir en reparto.
              </p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        </section>

        <section>
          <SectionHeader title="Abierto ahora" href="/comercios" />
          <OpenNowList merchants={merchants} />
        </section>
      </main>

      <footer className="mt-10 border-t border-line px-4 pb-6 pt-6 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-muted">
          <MotoIcon className="h-4 w-auto" />
          Envío desde {formatPrice(minDeliveryFee)} · {appConfig.deliveryTime} · {appConfig.city}
        </p>
        <a
          href={`https://wa.me/${appConfig.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-full bg-brand-soft px-4 py-2 text-[12px] font-semibold text-brand-dark"
        >
          Escribinos por WhatsApp
        </a>
      </footer>

    </div>
    </PageTransition>
  );
}
