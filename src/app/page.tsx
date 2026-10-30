import { CategoryPill } from "@/components/category-pill";
import { MerchantCard } from "@/components/merchant-card";
import { SearchBar } from "@/components/search-bar";
import { appConfig } from "@/lib/config";
import { categories, merchants } from "@/lib/demo-data";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-line bg-background/85 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg"
              aria-hidden
            >
              🛵
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-foreground">
                {appConfig.name}
              </p>
              <p className="text-[11px] text-muted">{appConfig.city}</p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-foreground"
          >
            📍 Cerca tuyo
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-5">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            ¿Qué querés comer hoy?
          </h1>
          <SearchBar />
        </section>

        <section className="-mx-4">
          <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryPill category={category} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-brand/10 p-4">
          <p className="text-sm font-semibold text-brand">Estamos arrancando 🚀</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground/70">
            Sumamos comercios de {appConfig.city} de a poco. Si querés que tu local
            esté en la app, escribinos.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold tracking-tight">Cerca tuyo</h2>
            <span className="text-xs text-muted">
              {merchants.length} comercios
            </span>
          </div>

          <ul className="space-y-2.5">
            {merchants.map((merchant) => (
              <li key={merchant.id}>
                <MerchantCard merchant={merchant} />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-8 border-t border-line px-4 py-5 text-center text-[11px] text-muted">
        {appConfig.name} · {appConfig.city} · Envío {appConfig.deliveryFee} ·{" "}
        {appConfig.deliveryTime}
      </footer>
    </div>
  );
}
