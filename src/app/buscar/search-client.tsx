"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { VendorRow } from "@/components/vendor-row";
import { categories, merchants } from "@/lib/demo-data";

export function SearchClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(
    searchParams.get("categoria") ?? undefined,
  );

  const activeCategory = categories.find((item) => item.id === category);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return merchants.filter((merchant) => {
      const matchesText =
        text.length === 0 ||
        merchant.name.toLowerCase().includes(text) ||
        merchant.category.toLowerCase().includes(text) ||
        merchant.tags.some((tag) => tag.toLowerCase().includes(text));

      const matchesCategory =
        !activeCategory ||
        merchant.tags.includes(activeCategory.label) ||
        merchant.category.includes(activeCategory.label);

      return matchesText && matchesCategory;
    });
  }, [query, activeCategory]);

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted focus-within:border-brand">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar comercio o comida"
          className="w-full bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted"
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
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                category === item.id ? "bg-brand text-white" : "bg-surface text-foreground"
              }`}
            >
              {item.emoji} {item.label}
            </button>
          </li>
        ))}
      </ul>

      {results.length > 0 ? (
        <ul className="space-y-2.5">
          {results.map((merchant) => (
            <li key={merchant.id}>
              <VendorRow merchant={merchant} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-14 text-center">
          <p className="text-3xl" aria-hidden>
            🔍
          </p>
          <p className="mt-2 text-[13.5px] font-semibold text-foreground">
            No encontramos nada
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Probá con otra palabra o quitá el filtro.
          </p>
        </div>
      )}
    </div>
  );
}
