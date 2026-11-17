"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { VendorRow } from "@/components/vendor-row";
import {
  categories,
  merchants,
  type MenuItem,
  type Merchant,
} from "@/lib/demo-data";

/**
 * Buscador: encuentra comercios y también productos ("muzzarella", "papas").
 * No distingue mayúsculas ni tildes, así "rotiseria" encuentra "Rotisería".
 */

/** Pasa a minúsculas y saca las tildes, para comparar sin sorpresas. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

type ProductHit = { merchant: Merchant; item: MenuItem };

/** Todos los productos del catálogo, con el texto por el que se los busca. */
const allProducts: (ProductHit & { haystack: string })[] = merchants.flatMap(
  (merchant) =>
    merchant.menu.flatMap((section) =>
      section.items.map((item) => ({
        merchant,
        item,
        haystack: normalize(`${item.name} ${item.description} ${section.name}`),
      })),
    ),
);

/** Como mucho mostramos esta cantidad de productos, para no hacer una lista eterna. */
const MAX_PRODUCTS = 12;

export function SearchClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<string | undefined>(
    searchParams.get("categoria") ?? undefined,
  );

  const activeCategory = categories.find((item) => item.id === category);
  const text = normalize(query.trim());

  const { shops, products } = useMemo(() => {
    const inCategory = (merchant: Merchant) =>
      !activeCategory ||
      merchant.tags.includes(activeCategory.label) ||
      merchant.category.includes(activeCategory.label);

    const shops = merchants.filter((merchant) => {
      if (!inCategory(merchant)) return false;
      if (text.length === 0) return true;
      return (
        normalize(merchant.name).includes(text) ||
        normalize(merchant.category).includes(text) ||
        merchant.tags.some((tag) => normalize(tag).includes(text))
      );
    });

    // Los productos aparecen recién cuando la persona escribe algo.
    const products: ProductHit[] =
      text.length < 2
        ? []
        : allProducts
            .filter(
              (entry) => inCategory(entry.merchant) && entry.haystack.includes(text),
            )
            .slice(0, MAX_PRODUCTS);

    return { shops, products };
  }, [text, activeCategory]);

  const nothing = shops.length === 0 && products.length === 0;

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted focus-within:border-brand">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar comercio o comida"
          enterKeyHint="search"
          className="w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted"
        />
      </label>

      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <li>
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
              !category ? "bg-brand text-white" : "bg-surface text-foreground"
            }`}
          >
            Todo
          </button>
        </li>
        {categories.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setCategory(item.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                category === item.id ? "bg-brand text-white" : "bg-surface text-foreground"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      {products.length > 0 ? (
        <section>
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-muted">
            Productos
          </h2>
          <ul className="mt-2 space-y-2">
            {products.map(({ merchant, item }) => (
              <li key={`${merchant.slug}:${item.id}`}>
                <Link
                  href={`/comercio/${merchant.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <Photo src={item.photo} emoji={item.emoji} sizes="56px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted">
                      {merchant.name}
                    </span>
                    <span className="mt-0.5 block">
                      <PriceTag item={item} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {shops.length > 0 ? (
        <section>
          {products.length > 0 ? (
            <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
              Comercios
            </h2>
          ) : null}
          <ul className="space-y-2.5">
            {shops.map((merchant) => (
              <li key={merchant.id}>
                <VendorRow merchant={merchant} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nothing ? (
        <div className="py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-muted">
            <SearchIcon />
          </span>
          <p className="mt-3 text-[13.5px] font-semibold text-foreground">
            No encontramos nada
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Probá con otra palabra o quitá el filtro.
          </p>
        </div>
      ) : null}
    </div>
  );
}
