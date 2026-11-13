import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { BottomNav } from "@/components/bottom-nav";
import {
  ChevronLeftIcon,
  ClockIcon,
  PlusIcon,
  ScooterIcon,
  StarIcon,
} from "@/components/icons";
import { formatPrice, getMerchantBySlug, merchants } from "@/lib/demo-data";

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
    <Suspense fallback={<MerchantSkeleton />}>
      <MerchantContent params={params} />
    </Suspense>
  );
}

/** Se ve un instante mientras carga la página del comercio. */
function MerchantSkeleton() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-24">
      <div className="h-48 animate-pulse bg-surface" />
      <div className="space-y-3 px-4 pt-4">
        <div className="h-6 w-2/3 animate-pulse rounded-md bg-surface" />
        <div className="h-3.5 w-1/3 animate-pulse rounded-md bg-surface" />
      </div>
    </div>
  );
}

async function MerchantContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);

  if (!merchant) notFound();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-white pb-24">
      <div
        className={`relative flex h-48 items-end bg-gradient-to-br ${merchant.gradient}`}
      >
        <Link
          href="/"
          aria-label="Volver"
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground backdrop-blur"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <span className="absolute inset-0 grid place-items-center text-[5.5rem]" aria-hidden>
          {merchant.emoji}
        </span>
      </div>

      <section className="-mt-5 rounded-t-3xl bg-white px-4 pt-4">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">
          {merchant.name}
        </h1>
        <p className="mt-0.5 text-[12.5px] text-muted">{merchant.category}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted">
          <span className="flex items-center gap-1 font-semibold text-brand-dark">
            <StarIcon />
            {merchant.rating.toFixed(1)}
            <span className="font-normal text-muted">({merchant.reviews})</span>
          </span>
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
      </section>

      <div className="mt-5 space-y-5">
        {merchant.menu.map((section) => (
          <section key={section.id}>
            <h2 className="px-4 text-[14px] font-bold tracking-tight text-foreground">
              {section.name}
            </h2>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {section.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface text-xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="truncate text-[11.5px] text-muted">{item.description}</p>
                    <p className="mt-0.5 text-[12.5px] font-semibold text-foreground">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Agregar ${item.name}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-dark"
                  >
                    <PlusIcon />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="px-4 py-6 text-center text-[11px] text-muted">
        Los precios incluyen impuestos. El envío se suma al finalizar.
      </p>

      <BottomNav />
    </div>
  );
}
