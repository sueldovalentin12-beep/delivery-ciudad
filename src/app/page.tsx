import Link from "next/link";
import { ActiveOrderBanner } from "@/components/active-order-banner";
import { AddressSelector, CartBadge } from "@/components/cart-badge";
import { Photo } from "@/components/photo";
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
const burgerCategory = categories.find((c) => c.id === "hamburguesas");

export default function Home() {
  return (
    <PageTransition>
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-20">
      <header
        style={{ viewTransitionName: "page-header" }}
        className="home-header bg-brand px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]"
      >
        <div className="flex items-center justify-between gap-3">
          <AddressSelector city={appConfig.city} />
          <CartBadge onBrand />
        </div>

        {/* Parece un campo de texto, pero es un link: la búsqueda de verdad vive en /buscar. */}
        <Link
          href="/buscar"
          className="mt-4 flex items-center gap-2.5 rounded-full bg-white px-4 py-3.5 text-[14px] text-muted shadow-sm"
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-brand-dark" />
          Locales, platos y productos
        </Link>
      </header>

      <ActiveOrderBanner />

      <main className="space-y-7 pt-4">
        <HeroCarousel slides={heroSlides} />

        <section className="grid grid-cols-2 gap-3 px-4">
          <Link
            href="/comercios"
            className="tile-press relative block h-36 overflow-hidden rounded-3xl bg-surface"
          >
            <Photo
              src={burgerCategory?.photo}
              emoji="🍔"
              gradient="from-rose-100 to-red-200"
              sizes="208px"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-3.5 text-[17px] font-extrabold text-white drop-shadow">
              Restaurantes
            </span>
          </Link>
          <Link
            href="/buscar"
            className="tile-press relative block h-36 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark"
          >
            <span className="absolute -right-2 -top-1 text-[5.5rem] leading-none opacity-90" aria-hidden>
              🏷️
            </span>
            <span className="absolute inset-x-0 bottom-0 p-3.5 text-[17px] font-extrabold text-white drop-shadow">
              Promociones
            </span>
          </Link>
        </section>

        <section>
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
