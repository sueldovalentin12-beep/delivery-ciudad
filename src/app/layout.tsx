import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { CartProvider } from "@/lib/cart";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { appConfig } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${appConfig.name} · ${appConfig.city}`,
    template: `%s · ${appConfig.name}`,
  },
  description: `${appConfig.tagline}. Comida a domicilio en ${appConfig.city}, con envío en ${appConfig.deliveryTime}.`,
  applicationName: appConfig.name,
  appleWebApp: {
    title: appConfig.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#24a840",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <CartProvider>
          {children}
          {/* El menú vive acá para no desmontarse al navegar. Suspense: en rutas con
              parámetro (/pedidos/[id]) la ruta se conoce recién al pedirla. */}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </CartProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
