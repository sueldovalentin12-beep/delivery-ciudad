# Al Toque

App de pedidos a domicilio para una ciudad chica (piloto en Villaguay). Se instala en el celular como una app (PWA). Next.js 16 + TypeScript + Tailwind CSS 4.

## Qué hace

- **Cliente** (`/`): mira los comercios, arma el carrito, pone su dirección (con ubicación del celular), nombre, teléfono y forma de pago, y confirma. El pedido le llega al comercio y puede seguirlo en un mapa.
- **Panel del dueño** (`/dueno`): ve los pedidos que van entrando y los pasa de estado (recibido, preparando, en camino, entregado) o los cancela.
- **Panel del repartidor** (`/repartidor`): ve los pedidos listos, los marca y comparte su ubicación para que el cliente lo siga.

Los paneles se abren con un PIN compartido. El servidor siempre recalcula los precios desde el catálogo: no confía en lo que manda el celular.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin base de datos, los pedidos se guardan en la memoria y se pierden al reiniciar: sirve para probar.

## Variables de entorno

Se ponen en `.env.local` (en la compu) o en el panel de Vercel (en producción).

| Variable | Para qué sirve |
| --- | --- |
| `OWNER_PIN` | PIN de los paneles del dueño y del repartidor. En desarrollo, si falta, se usa `4821`. En producción es obligatoria. |
| `DATABASE_URL` | Dirección de la base de datos Postgres (por ejemplo Neon). En producción es obligatoria: sin ella no se aceptan pedidos. Las tablas se crean solas. |

## Dónde editar

- **Comercios, platos, precios, envío y pedido mínimo:** `src/lib/demo-data.ts`.
- **Datos del negocio (WhatsApp, nombre, etc.):** `src/lib/config.ts`.

## Cómo publicarlo en Vercel

1. Subí el proyecto a GitHub y importalo en Vercel.
2. En Settings > Environment Variables cargá `OWNER_PIN` y `DATABASE_URL`.
3. Hacé el deploy. Cada push a `main` publica una versión nueva.
