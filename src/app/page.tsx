import { BottomNav } from "@/components/bottom-nav";
import { CartBadge } from "@/components/cart-badge";
import { CategoryTile } from "@/components/category-tile";
import { HeroCarousel } from "@/components/hero-carousel";
import { ChevronRightIcon, PinIcon } from "@/components/icons";
import { SectionHeader } from "@/components/section-header";
import { VendorCard } from "@/components/vendor-card";
import { VendorRow } from "@/components/vendor-row";
import { appConfig } from "@/lib/config";
import { categories, heroSlides, merchants } from "@/lib/demo-data";

export default function Home() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-20">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button type="button" className="flex min-w-0 items-center gap-2 text-left">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-dark">
              <PinIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-medium uppercase tracking-wide text-muted">
                Entregar en
              </span>
              <span className="flex items-center gap-0.5 truncate text-[13.5px] font-semibold text-foreground">
                {appConfig.city}
                <ChevronRightIcon className="h-3.5 w-3.5 rotate-90 text-muted" />
              </span>
            </span>
          </button>

          <CartBadge />
        </div>
      </header>

      <main className="space-y-6 pt-1">
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
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
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
          </div>
        </section>

        <section>
          <SectionHeader title="Abierto ahora" />
          <ul className="mt-3 space-y-2.5 px-4">
            {merchants.slice(0, 3).map((merchant) => (
              <li key={merchant.id}>
                  <VendorRow merchant={merchant} />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-8 px-4 pb-6 text-center text-[11px] leading-relaxed text-muted">
        {appConfig.name} · {appConfig.city}
        <br />
        Envío desde {appConfig.deliveryFee} · {appConfig.deliveryTime}
      </footer>

      <BottomNav />
    </div>
  );
}
