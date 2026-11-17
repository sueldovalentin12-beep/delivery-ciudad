import { everyDay, type WeekHours } from "@/lib/hours";

/**
 * El catálogo del piloto: comercios, platos y precios.
 * Es la fuente de verdad: el servidor recalcula los precios de cada pedido
 * desde acá, sin confiar en lo que manda el celular.
 */

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** Precio de lista. El que se cobra sale de itemPrice() (lib/pricing). */
  price: number;
  emoji: string;
  /** Foto del plato (cuadrada). Si falta o no carga, se ve el emoji. */
  photo?: string;
  /** Descuento en porcentaje sobre este plato (ej. 20 = 20% off). */
  discountPercent?: number;
  /** Sale en "Los más pedidos" arriba del menú. */
  featured?: boolean;
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
  /** Foto de portada del comercio (apaisada). Si falta, se ve el emoji. */
  photo?: string;
  /** Calificación promedio. Todavía no hay reseñas: no se muestra si falta. */
  rating?: number;
  /** Cantidad de reseñas detrás de la calificación. */
  reviews?: number;
  /** Horarios de atención, siempre en la hora de config.timeZone. */
  hours: WeekHours;
  deliveryMinutes: string;
  deliveryFee: string;
  /** El envío en pesos, para calcular. */
  deliveryFeeValue: number;
  minOrder: string;
  /** El pedido mínimo en pesos, para calcular. */
  minOrderValue: number;
  tags: string[];
  menu: MenuSection[];
};

export type Category = {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  /** Foto de la categoría (cuadrada). Si falta, se ve el emoji. */
  photo?: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  /** Foto de fondo de la portada (con un degradé encima para leer el texto). */
  photo?: string;
  href: string;
};

/** Dónde viven las fotos (public/fotos). Una por comercio, plato y categoría. */
export const merchantPhoto = (slug: string) => `/fotos/comercios/${slug}.webp`;
export const productPhoto = (slug: string, itemId: string) =>
  `/fotos/productos/${slug}--${itemId}.webp`;
export const categoryPhoto = (id: string) => `/fotos/categorias/${id}.webp`;

export const categories: Category[] = [
  { id: "pizza", label: "Pizza", emoji: "🍕", gradient: "from-amber-100 to-orange-200", photo: categoryPhoto("pizza") },
  { id: "hamburguesas", label: "Hamburguesas", emoji: "🍔", gradient: "from-rose-100 to-red-200", photo: categoryPhoto("hamburguesas") },
  { id: "empanadas", label: "Empanadas", emoji: "🥟", gradient: "from-yellow-100 to-amber-200", photo: categoryPhoto("empanadas") },
  { id: "helados", label: "Helados", emoji: "🍦", gradient: "from-sky-100 to-cyan-200", photo: categoryPhoto("helados") },
  { id: "rotiseria", label: "Rotisería", emoji: "🍗", gradient: "from-lime-100 to-green-200", photo: categoryPhoto("rotiseria") },
  { id: "sushi", label: "Sushi", emoji: "🍣", gradient: "from-violet-100 to-purple-200", photo: categoryPhoto("sushi") },
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
    photo: merchantPhoto("pizzeria-la-esquina"),
    href: "/comercio/pizzeria-la-esquina",
  },
  {
    id: "helado",
    title: "Se viene el calor",
    subtitle: "Helados artesanales con 15% off",
    emoji: "🍦",
    gradient: "from-sky-400 via-cyan-300 to-teal-300",
    photo: merchantPhoto("heladeria-del-sur"),
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
    photo: merchantPhoto("pizzeria-la-esquina"),
    hours: everyDay(["11:00", "15:00"], ["19:00", "00:30"]),
    deliveryMinutes: "25-35",
    deliveryFee: "$700",
    deliveryFeeValue: 700,
    minOrder: "$3.500",
    minOrderValue: 3500,
    tags: ["Pizza", "Empanadas", "Milanesas"],
    menu: [
      {
        id: "pizzas",
        name: "Pizzas",
        items: [
          { id: "muzza", name: "Muzzarella", description: "Salsa de tomate, muzzarella y orégano", price: 7800, emoji: "🍕", photo: productPhoto("pizzeria-la-esquina", "muzza"), discountPercent: 20, featured: true },
          { id: "napolitana", name: "Napolitana", description: "Muzzarella, tomate en rodajas y ajo", price: 9200, emoji: "🍅", photo: productPhoto("pizzeria-la-esquina", "napolitana"), featured: true },
          { id: "especial", name: "La Esquina", description: "Jamón, morrón, huevo y aceitunas", price: 10500, emoji: "🥚", photo: productPhoto("pizzeria-la-esquina", "especial") },
        ],
      },
      {
        id: "empanadas",
        name: "Empanadas",
        items: [
          { id: "carne", name: "Carne cortada a cuchillo", description: "Con huevo y verdeo", price: 1200, emoji: "🥟", photo: productPhoto("pizzeria-la-esquina", "carne") },
          { id: "pollo", name: "Pollo", description: "Con morrón y especias", price: 1200, emoji: "🍗", photo: productPhoto("pizzeria-la-esquina", "pollo") },
          { id: "jyq", name: "Jamón y queso", description: "Clásica de siempre", price: 1100, emoji: "🧀", photo: productPhoto("pizzeria-la-esquina", "jyq") },
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
    photo: merchantPhoto("hamburguesas-el-patio"),
    hours: everyDay(["11:30", "15:30"], ["19:30", "01:00"]),
    deliveryMinutes: "30-40",
    deliveryFee: "$700",
    deliveryFeeValue: 700,
    minOrder: "$4.000",
    minOrderValue: 4000,
    tags: ["Hamburguesas", "Papas fritas", "Cerveza"],
    menu: [
      {
        id: "burgers",
        name: "Hamburguesas",
        items: [
          { id: "clasica", name: "Clásica", description: "Carne, queso, lechuga, tomate y salsa", price: 8500, emoji: "🍔", photo: productPhoto("hamburguesas-el-patio", "clasica"), featured: true },
          { id: "doble", name: "Doble cheddar", description: "Dos medallones y cheddar fundido", price: 11200, emoji: "🧀", photo: productPhoto("hamburguesas-el-patio", "doble"), featured: true },
          { id: "veggie", name: "Veggie", description: "Medallón de garbanzo y palta", price: 8900, emoji: "🥑", photo: productPhoto("hamburguesas-el-patio", "veggie") },
        ],
      },
      {
        id: "acomp",
        name: "Para compartir",
        items: [
          { id: "papas", name: "Papas con cheddar", description: "Con panceta y verdeo", price: 5200, emoji: "🍟", photo: productPhoto("hamburguesas-el-patio", "papas") },
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
    photo: merchantPhoto("rotiseria-dona-rosa"),
    hours: everyDay(["10:00", "15:00"], ["19:00", "23:00"]),
    deliveryMinutes: "20-30",
    deliveryFee: "$500",
    deliveryFeeValue: 500,
    minOrder: "$3.000",
    minOrderValue: 3000,
    tags: ["Casero", "Milanesas", "Guisos"],
    menu: [
      {
        id: "del-dia",
        name: "Menú del día",
        items: [
          { id: "milanesa", name: "Milanesa con puré", description: "Con guarnición a elección", price: 6900, emoji: "🍽️", photo: productPhoto("rotiseria-dona-rosa", "milanesa"), featured: true },
          { id: "guiso", name: "Guiso de lentejas", description: "Con chorizo colorado", price: 6500, emoji: "🥘", photo: productPhoto("rotiseria-dona-rosa", "guiso") },
        ],
      },
      {
        id: "pollo",
        name: "Pollo",
        items: [
          { id: "asado", name: "Pollo al horno", description: "Con papas y limón", price: 8200, emoji: "🍗", photo: productPhoto("rotiseria-dona-rosa", "asado"), featured: true },
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
    photo: merchantPhoto("heladeria-del-sur"),
    hours: everyDay(["12:00", "00:00"]),
    deliveryMinutes: "20-30",
    deliveryFee: "$600",
    deliveryFeeValue: 600,
    minOrder: "$2.500",
    minOrderValue: 2500,
    tags: ["Helados", "Postres", "Café"],
    menu: [
      {
        id: "helados",
        name: "Helados",
        items: [
          { id: "cuarto", name: "1/4 kg", description: "Hasta 2 gustos", price: 3500, emoji: "🍨", photo: productPhoto("heladeria-del-sur", "cuarto") },
          { id: "medio", name: "1/2 kg", description: "Hasta 3 gustos", price: 6200, emoji: "🍧", photo: productPhoto("heladeria-del-sur", "medio"), featured: true },
          { id: "kilo", name: "1 kg", description: "Hasta 4 gustos", price: 11000, emoji: "🍦", photo: productPhoto("heladeria-del-sur", "kilo"), discountPercent: 15, featured: true },
        ],
      },
    ],
  },
];

export function getMerchantBySlug(slug: string) {
  return merchants.find((merchant) => merchant.slug === slug);
}

/** Busca un plato por comercio e id. */
export function findMenuItem(
  merchantSlug: string,
  itemId: string,
): { merchant: Merchant; item: MenuItem } | undefined {
  const merchant = getMerchantBySlug(merchantSlug);
  if (!merchant) return undefined;
  for (const section of merchant.menu) {
    const item = section.items.find((entry) => entry.id === itemId);
    if (item) return { merchant, item };
  }
  return undefined;
}

/** Busca un plato por su clave de carrito "comercio:plato". */
export function findMenuItemByKey(key: string) {
  const colon = key.indexOf(":");
  if (colon <= 0) return undefined;
  return findMenuItem(key.slice(0, colon), key.slice(colon + 1));
}

export function formatPrice(value: number) {
  return "$" + value.toLocaleString("es-AR");
}
