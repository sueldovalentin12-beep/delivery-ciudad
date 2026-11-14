"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

/**
 * El carrito vive en la memoria del navegador del cliente.
 * Por ahora se guarda en el mismo celular (localStorage): si cierra el
 * navegador y vuelve, el pedido sigue ahí. En la Etapa 4 se mueve a la base
 * de datos para que también lo vea el comercio.
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
  add: (item: NewCartItem) => void;
  /** Suma 1. Si la cantidad llega a 0, el plato desaparece. */
  changeQty: (key: string, delta: number) => void;
  clear: () => void;
  qtyOf: (key: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function buildItemKey(merchantSlug: string, itemId: string) {
  return `${merchantSlug}:${itemId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Al abrir la app, recuperamos lo que había guardado.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (value): value is CartItem =>
                typeof value === "object" &&
                value !== null &&
                typeof (value as CartItem).key === "string" &&
                typeof (value as CartItem).qty === "number" &&
                (value as CartItem).qty > 0,
            ),
          );
        }
      }
    } catch {
      // Si el dato guardado está roto, arrancamos con el carrito vacío.
    }
    setReady(true);
  }, []);

  // Cada cambio se guarda.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Modo incógnito o sin espacio: seguimos funcionando en memoria.
    }
  }, [items, ready]);

  const add = useCallback((item: NewCartItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.key === item.key);
      if (existing) {
        return current.map((entry) =>
          entry.key === item.key ? { ...entry, qty: entry.qty + 1 } : entry,
        );
      }
      return [...current, { ...item, qty: 1 }];
    });
  }, []);

  const changeQty = useCallback((key: string, delta: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry.key === key ? { ...entry, qty: entry.qty + delta } : entry,
        )
        .filter((entry) => entry.qty > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

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
      add,
      changeQty,
      clear,
      qtyOf: (key: string) =>
        items.find((entry) => entry.key === key)?.qty ?? 0,
    };
  }, [items, ready, add, changeQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart se tiene que usar dentro de <CartProvider>");
  }
  return context;
}
