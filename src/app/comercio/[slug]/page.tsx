import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { CartButton } from "@/components/cart-button";
import { PageTransition } from "@/components/page-transition";
import { CartSummaryBar } from "@/components/cart-summary-bar";
import {
  ChevronLeftIcon,
  ClockIcon,
  ScooterIcon,
  StarIcon,
} from "@/components/icons";
import { ClosedNotice, HoursPanel } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import {
  formatPrice,
  getMerchantBySlug,
  merchants,
  type MenuItem,
  type Merchant,
} from "@/lib/demo-data";
import { itemPrice } from "@/lib/pricing";

export function generateStaticParams() {
  return merchants.map((merchant) => ({ slug: merchant.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/comercio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);
  return { title: merchant ? merchant.name : "Comercio" };
}

export default function MerchantPage({ params }: PageProps<"/comercio/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<MerchantSkeleton />}>
        <MerchantContent params={params} />
      </Suspense>
    </PageTransition>
  );
}

/**
 * Se ve un instante mientras carga la página del comercio. Tiene la misma
 * altura y las mismas piezas que la página real, así no hay salto al entrar.
 */
function MerchantSkeleton() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-36" aria-hidden>
      <div className="skeleton h-52" />
      <div className="relative z-10 -mt-5 space-y-3 rounded-t-3xl bg-white px-4 pt-4">
        <div className="skeleton h-6 w-2/3 rounded-md" />
        <div className="skeleton h-3.5 w-1/3 rounded-md" />
        <div className="skeleton h-3.5 w-3/4 rounded-md" />
      </div>
      <div className="mt-6 space-y-3 px-4">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3">
            <div className="skeleton h-[4.5rem] w-[4.5rem] rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-1/2 rounded-md" />
              <div className="skeleton h-3 w-3/4 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function MerchantContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);

  if (!merchant) notFound();

  const featured = merchant.menu
    .flatMap((section) => section.items)
    .filter((item) => item.featured);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-36">
      <div className="relative h-52 overflow-hidden bg-surface">
        <Photo
          src={merchant.photo}
          emoji={merchant.emoji}
          gradient={merchant.gradient}
          sizes="(max-width: 448px) 100vw, 448px"
          preload
          alt={merchant.name}
          emojiClassName="text-[5.5rem]"
        />
        {/* Degradé de arriba: el botón de volver se lee sobre cualquier foto. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
        <Link
          href="/"
          transitionTypes={["nav-back"]}
          aria-label="Volver"
          className="absolute left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
      </div>

      {/* relative + z-10: la portada es "relative"; sin esto la hoja blanca se
          pinta DEBAJO de la foto y el nombre queda cortado. */}
      <section className="relative z-10 -mt-5 rounded-t-3xl bg-white px-4 pt-4">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">
          {merchant.name}
        </h1>
        <p className="mt-0.5 text-[12.5px] text-muted">{merchant.category}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted">
          {merchant.rating !== undefined ? (
            <span className="flex items-center gap-1 font-semibold text-brand-dark">
              <StarIcon />
              {merchant.rating.toFixed(1)}
              {merchant.reviews !== undefined ? (
                <span className="font-normal text-muted">({merchant.reviews})</span>
              ) : null}
            </span>
          ) : (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold text-brand-dark">
              Nuevo
            </span>
          )}
          <span className="flex items-center gap-1">
            <ClockIcon />
            {merchant.deliveryMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <ScooterIcon />
            Envío {merchant.deliveryFee}
          </span>
          <span>Mínimo {merchant.minOrder}</span>
        </div>

        <ClosedNotice merchant={merchant} />
        <HoursPanel merchant={merchant} />
      </section>

      <div className="mt-5 space-y-6">
        {featured.length > 0 ? (
          <section>
            <h2 className="px-4 text-[14px] font-bold tracking-tight text-foreground">
              Los más pedidos
            </h2>
            <ul className="no-scrollbar mt-2.5 flex gap-3 overflow-x-auto px-4 pb-1">
              {featured.map((item) => (
                <li key={item.id}>
                  <FeaturedCard merchant={merchant} item={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {merchant.menu.map((section) => (
          <section key={section.id}>
            <h2 className="px-4 text-[14px] font-bold tracking-tight text-foreground">
              {section.name}
            </h2>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {section.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-surface">
                    <Photo
                      src={item.photo}
                      emoji={item.emoji}
                      gradient={merchant.gradient}
                      sizes="72px"
                      emojiClassName="text-2xl"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="line-clamp-2 text-[11.5px] leading-snug text-muted">
                      {item.description}
                    </p>
                    <div className="mt-1">
                      <PriceTag item={item} />
                    </div>
                  </div>
                  <AddButton merchant={merchant} item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="px-4 py-6 text-center text-[11px] text-muted">
        Los precios incluyen impuestos. El envío se suma al finalizar.
      </p>

      <CartSummaryBar />
    </div>
  );
}

/** El "+" de un plato, con el precio final (descuento incluido). */
function AddButton({ merchant, item }: { merchant: Merchant; item: MenuItem }) {
  return (
    <CartButton
      merchantSlug={merchant.slug}
      merchantName={merchant.name}
      itemId={item.id}
      name={item.name}
      price={itemPrice(item).final}
      emoji={item.emoji}
    />
  );
}

/** Tarjeta grande de "Los más pedidos": foto, nombre, precio y el botón de sumar. */
function FeaturedCard({ merchant, item }: { merchant: Merchant; item: MenuItem }) {
  const { final, original, percent } = itemPrice(item);
  return (
    <div className="w-40 shrink-0">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <Photo
          src={item.photo}
          emoji={item.emoji}
          gradient={merchant.gradient}
          sizes="160px"
          emojiClassName="text-5xl"
        />
        {percent > 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-brand-dark shadow-sm">
            −{percent}%
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-[13px] font-semibold text-foreground">{item.name}</p>
      <div className="mt-1 flex items-start justify-between gap-2">
        {/* Precio apilado (final arriba, de lista tachado abajo) para que entre al lado del botón. */}
        <span className="min-w-0 pt-0.5">
          <span className="block text-[12.5px] font-semibold tabular-nums text-foreground">
            {formatPrice(final)}
          </span>
          {percent > 0 ? (
            <s className="block text-[11px] tabular-nums text-muted">
              {formatPrice(original)}
            </s>
          ) : null}
        </span>
        <AddButton merchant={merchant} item={item} />
      </div>
    </div>
  );
}
