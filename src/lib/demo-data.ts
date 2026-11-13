/**
 * Datos de mentira para las Etapas 1 y 2.
 * En la Etapa 4 esto se reemplaza por la base de datos real.
 */

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
};

export type MenuSection = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type Merchant = {
  id: string;
  slug: string;
  name: string;
  category: string;
  emoji: string;
  /** Clases de Tailwind para el degradado de la portada. */
  gradient: string;
  rating: number;
  reviews: number;
  deliveryMinutes: string;
  deliveryFee: string;
  minOrder: string;
  promo?: string;
  tags: string[];
  menu: MenuSection[];
};

export type Category = {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  href: string;
};

export const categories: Category[] = [
  { id: "pizza", label: "Pizza", emoji: "🍕", gradient: "from-amber-100 to-orange-200" },
  { id: "hamburguesas", label: "Hamburguesas", emoji: "🍔", gradient: "from-rose-100 to-red-200" },
  { id: "empanadas", label: "Empanadas", emoji: "🥟", gradient: "from-yellow-100 to-amber-200" },
  { id: "helados", label: "Helados", emoji: "🍦", gradient: "from-sky-100 to-cyan-200" },
  { id: "rotiseria", label: "Rotisería", emoji: "🍗", gradient: "from-lime-100 to-green-200" },
  { id: "sushi", label: "Sushi", emoji: "🍣", gradient: "from-violet-100 to-purple-200" },
];

export const heroSlides: HeroSlide[] = [
  {
    id: "envio",
    title: "Envío en 30 minutos",
    subtitle: "Directo del local a tu puerta, en Villaguay",
    emoji: "🛵",
    gradient: "from-brand via-lime-400 to-emerald-500",
    href: "/buscar",
  },
  {
    id: "pizza",
    title: "La pizza del barrio",
    subtitle: "Recién salida del horno, a dos cuadras",
    emoji: "🍕",
    gradient: "from-orange-400 via-amber-400 to-yellow-300",
    href: "/comercio/pizzeria-la-esquina",
  },
  {
    id: "helado",
    title: "Se viene el calor",
    subtitle: "Helados artesanales con 15% off",
    emoji: "🍦",
    gradient: "from-sky-400 via-cyan-300 to-teal-300",
    href: "/comercio/heladeria-del-sur",
  },
];

export const merchants: Merchant[] = [
  {
    id: "la-esquina",
    slug: "pizzeria-la-esquina",
    name: "Pizzería La Esquina",
    category: "Pizza · Empanadas",
    emoji: "🍕",
    gradient: "from-amber-200 via-orange-200 to-rose-200",
    rating: 4.7,
    reviews: 128,
    deliveryMinutes: "25-35",
    deliveryFee: "$700",
    minOrder: "$3.500",
    promo: "2x1 en muzzarella",
    tags: ["Pizza", "Empanadas", "Milanesas"],
    menu: [
      {
        id: "pizzas",
        name: "Pizzas",
        items: [
          { id: "muzza", name: "Muzzarella", description: "Salsa de tomate, muzzarella y orégano", price: 7800, emoji: "🍕" },
          { id: "napolitana", name: "Napolitana", description: "Muzzarella, tomate en rodajas y ajo", price: 9200, emoji: "🍅" },
          { id: "especial", name: "La Esquina", description: "Jamón, morrón, huevo y aceitunas", price: 10500, emoji: "🥚" },
        ],
      },
      {
        id: "empanadas",
        name: "Empanadas",
        items: [
          { id: "carne", name: "Carne cortada a cuchillo", description: "Con huevo y verdeo", price: 1200, emoji: "🥟" },
          { id: "pollo", name: "Pollo", description: "Con morrón y especias", price: 1200, emoji: "🍗" },
          { id: "jyq", name: "Jamón y queso", description: "Clásica de siempre", price: 1100, emoji: "🧀" },
        ],
      },
    ],
  },
  {
    id: "el-patio",
    slug: "hamburguesas-el-patio",
    name: "Hamburguesas El Patio",
    category: "Hamburguesas · Papas",
    emoji: "🍔",
    gradient: "from-rose-200 via-red-200 to-orange-200",
    rating: 4.5,
    reviews: 94,
    deliveryMinutes: "30-40",
    deliveryFee: "$700",
    minOrder: "$4.000",
    tags: ["Hamburguesas", "Papas fritas", "Cerveza"],
    menu: [
      {
        id: "burgers",
        name: "Hamburguesas",
        items: [
          { id: "clasica", name: "Clásica", description: "Carne, queso, lechuga, tomate y salsa", price: 8500, emoji: "🍔" },
          { id: "doble", name: "Doble cheddar", description: "Dos medallones y cheddar fundido", price: 11200, emoji: "🧀" },
          { id: "veggie", name: "Veggie", description: "Medallón de garbanzo y palta", price: 8900, emoji: "🥑" },
        ],
      },
      {
        id: "acomp",
        name: "Para compartir",
        items: [
          { id: "papas", name: "Papas con cheddar", description: "Con panceta y verdeo", price: 5200, emoji: "🍟" },
        ],
      },
    ],
  },
  {
    id: "dona-rosa",
    slug: "rotiseria-dona-rosa",
    name: "Rotisería Doña Rosa",
    category: "Rotisería · Casero",
    emoji: "🍗",
    gradient: "from-lime-200 via-green-200 to-emerald-200",
    rating: 4.9,
    reviews: 312,
    deliveryMinutes: "20-30",
    deliveryFee: "$500",
    minOrder: "$3.000",
    promo: "Menú del día $6.900",
    tags: ["Casero", "Milanesas", "Guisos"],
    menu: [
      {
        id: "del-dia",
        name: "Menú del día",
        items: [
          { id: "milanesa", name: "Milanesa con puré", description: "Con guarnición a elección", price: 6900, emoji: "🍽️" },
          { id: "guiso", name: "Guiso de lentejas", description: "Con chorizo colorado", price: 6500, emoji: "🥘" },
        ],
      },
      {
        id: "pollo",
        name: "Pollo",
        items: [
          { id: "asado", name: "Pollo al horno", description: "Con papas y limón", price: 8200, emoji: "🍗" },
        ],
      },
    ],
  },
  {
    id: "heladeria-sur",
    slug: "heladeria-del-sur",
    name: "Heladería del Sur",
    category: "Helados · Postres",
    emoji: "🍦",
    gradient: "from-sky-200 via-cyan-200 to-teal-200",
    rating: 4.6,
    reviews: 87,
    deliveryMinutes: "20-30",
    deliveryFee: "$600",
    minOrder: "$2.500",
    promo: "15% off en 1 kg",
    tags: ["Helados", "Postres", "Café"],
    menu: [
      {
        id: "helados",
        name: "Helados",
        items: [
          { id: "cuarto", name: "1/4 kg", description: "Hasta 2 gustos", price: 3500, emoji: "🍨" },
          { id: "medio", name: "1/2 kg", description: "Hasta 3 gustos", price: 6200, emoji: "🍧" },
          { id: "kilo", name: "1 kg", description: "Hasta 4 gustos", price: 11000, emoji: "🍦" },
        ],
      },
    ],
  },
];

export function getMerchantBySlug(slug: string) {
  return merchants.find((merchant) => merchant.slug === slug);
}

export function formatPrice(value: number) {
  return "$" + value.toLocaleString("es-AR");
}
