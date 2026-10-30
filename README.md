# Delivery

App de pedidos a domicilio para una ciudad chica. Next.js 16 + TypeScript + Tailwind CSS 4.

## Desarrollo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Estructura

```
src/
├── app/
│   ├── layout.tsx      → estructura base, fuentes y metadatos
│   ├── page.tsx        → pantalla de inicio
│   └── globals.css     → colores y estilos globales
├── components/         → piezas reutilizables de interfaz
└── lib/
    ├── config.ts       → nombre, ciudad, envío
    └── demo-data.ts    → datos de prueba (se reemplazan en la Etapa 4)
```

## Etapas

- [x] **Etapa 1** — Esqueleto, home y deploy
- [ ] **Etapa 2** — Catálogo de comercios y menús
- [ ] **Etapa 3** — Carrito y pedido
- [ ] **Etapa 4** — Base de datos real
- [ ] **Etapa 5** — Panel del comercio y del repartidor
- [ ] **Etapa 6** — Notificaciones y prueba real

## Cambiar la ciudad o el nombre

Todo vive en `src/lib/config.ts`. Editá ese archivo y la app entera se actualiza.
