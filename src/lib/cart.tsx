"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { findMenuItemByKey } from "@/lib/demo-data";
import { itemPrice } from "@/lib/pricing";
import { readStored, useStored, writeStored } from "@/lib/local-store";

/**
 * El carrito vive en la memoria del navegador del cliente.
 * Se guarda en el mismo celular (localStorage): si cierra el navegador y
 * vuelve, el pedido sigue ahí. Un pedido es de un solo comercio, porque
 * cada uno tiene su envío y su pedido mínimo.
 */

export type CartItem = {
  /** Identificador único: comercio + plato. */
  key: string;
  merchantSlug: string;
  merchantName: string;
  name: string;
  price: number;
  emoji: string;
  qty: number;
};

export type NewCartItem = Omit<CartItem, "qty">;

const STORAGE_KEY = "altoque.cart.v1";

type CartContextValue = {
  items: CartItem[];
  /** false hasta que terminamos de leer el carrito guardado. */
  ready: boolean;
  count: number;
  subtotal: number;
  /** Comercio de los productos del carrito (null si está vacío). */
  merchantSlug: string | null;
  merchantName: string | null;
  /** Suma 1. Si el carrito es de otro comercio no hace nada y devuelve false. */
  add: (item: NewCartItem) => boolean;
  /** Vacía el carrito y deja solo este producto (para cambiar de comercio). */
  replaceWith: (item: NewCartItem) => void;
  /** Suma 1. Si la cantidad llega a 0, el plato desaparece. */
  changeQty: (key: string, delta: number) => void;
  clear: () => void;
  qtyOf: (key: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function buildItemKey(merchantSlug: string, itemId: string) {
  return `${merchantSlug}:${itemId}`;
}

/**
 * Lee lo guardado y lo deja consistente:
 * - descarta lo que ya no existe en el catálogo,
 * - actualiza nombre, precio (con el descuento de hoy) y emoji desde el catálogo
 *   (nada de precios viejos; la foto se busca al mostrar, no se guarda),
 * - si hay productos de varios comercios (datos viejos), queda solo el primero.
 */
function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const result: CartItem[] = [];
    let slug: string | null = null;
    for (const value of parsed) {
      if (
        typeof value !== "object" ||
        value === null ||
        typeof (value as CartItem).key !== "string" ||
        typeof (value as CartItem).qty !== "number" ||
        !((value as CartItem).qty > 0)
      ) {
        continue;
      }
      const entry = value as CartItem;
      const found = findMenuItemByKey(entry.key);
      if (!found) continue;
      if (slug === null) slug = found.merchant.slug;
      if (found.merchant.slug !== slug) continue;
      const existing = result.find((current) => current.key === entry.key);
      const qty = Math.min(99, Math.floor(entry.qty));
      if (existing) {
        existing.qty = Math.min(99, existing.qty + qty);
        continue;
      }
      result.push({
        key: entry.key,
        merchantSlug: found.merchant.slug,
        merchantName: found.merchant.name,
        name: found.item.name,
        price: itemPrice(found.item).final,
        emoji: found.item.emoji,
        qty,
      });
    }
    return result;
  } catch {
    // Si el dato guardado está roto, arrancamos con el carrito vacío.
    return [];
  }
}

/** Aplica un cambio sobre el carrito guardado y lo vuelve a guardar. */
function commit(update: (current: CartItem[]) => CartItem[]) {
  const current = parseCart(readStored(STORAGE_KEY));
  writeStored(STORAGE_KEY, JSON.stringify(update(current)));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useStored(STORAGE_KEY);
  const ready = raw !== undefined;
  const items = useMemo(() => parseCart(raw ?? null), [raw]);

  const add = useCallback((item: NewCartItem) => {
    const current = parseCart(readStored(STORAGE_KEY));
    if (current.length > 0 && current[0].merchantSlug !== item.merchantSlug) {
      return false;
    }
    commit((list) => {
      const existing = list.find((entry) => entry.key === item.key);
      if (existing) {
        return list.map((entry) =>
          entry.key === item.key
            ? { ...entry, qty: Math.min(99, entry.qty + 1) }
            : entry,
        );
      }
      return [...list, { ...item, qty: 1 }];
    });
    return true;
  }, []);

  const replaceWith = useCallback((item: NewCartItem) => {
    commit(() => [{ ...item, qty: 1 }]);
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    commit((list) =>
      list
        .map((entry) =>
          entry.key === key
            ? { ...entry, qty: Math.min(99, entry.qty + delta) }
            : entry,
        )
        .filter((entry) => entry.qty > 0),
    );
  }, []);

  const clear = useCallback(() => commit(() => []), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, entry) => total + entry.qty, 0);
    const subtotal = items.reduce(
      (total, entry) => total + entry.price * entry.qty,
      0,
    );

    return {
      items,
      ready,
      count,
      subtotal,
      merchantSlug: items[0]?.merchantSlug ?? null,
      merchantName: items[0]?.merchantName ?? null,
      add,
      replaceWith,
      changeQty,
      clear,
      qtyOf: (key: string) =>
        items.find((entry) => entry.key === key)?.qty ?? 0,
    };
  }, [items, ready, add, replaceWith, changeQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart se tiene que usar dentro de <CartProvider>");
  }
  return context;
}
