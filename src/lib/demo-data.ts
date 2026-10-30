/**
 * Datos de mentira para la Etapa 1.
 * En la Etapa 4 esto se reemplaza por la base de datos real.
 */

export type Merchant = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  tint: string;
  rating: number;
  deliveryMinutes: string;
  deliveryFee: string;
};

export type Category = {
  id: string;
  label: string;
  emoji: string;
};

export const categories: Category[] = [
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "hamburguesas", label: "Hamburguesas", emoji: "🍔" },
  { id: "empanadas", label: "Empanadas", emoji: "🥟" },
  { id: "helados", label: "Helados", emoji: "🍦" },
  { id: "rotiseria", label: "Rotisería", emoji: "🍗" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
];

export const merchants: Merchant[] = [
  {
    id: "la-esquina",
    name: "Pizzería La Esquina",
    category: "Pizza · Empanadas",
    emoji: "🍕",
    tint: "bg-orange-100",
    rating: 4.7,
    deliveryMinutes: "25-35",
    deliveryFee: "$700",
  },
  {
    id: "el-patio",
    name: "Hamburguesas El Patio",
    category: "Hamburguesas · Papas",
    emoji: "🍔",
    tint: "bg-amber-100",
    rating: 4.5,
    deliveryMinutes: "30-40",
    deliveryFee: "$700",
  },
  {
    id: "doña-rosa",
    name: "Rotisería Doña Rosa",
    category: "Rotisería · Casero",
    emoji: "🍗",
    tint: "bg-rose-100",
    rating: 4.9,
    deliveryMinutes: "20-30",
    deliveryFee: "$500",
  },
  {
    id: "heladeria-sur",
    name: "Heladería del Sur",
    category: "Helados · Postres",
    emoji: "🍦",
    tint: "bg-sky-100",
    rating: 4.6,
    deliveryMinutes: "20-30",
    deliveryFee: "$600",
  },
];
