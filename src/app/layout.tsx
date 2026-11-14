import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
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
};

export const viewport: Viewport = {
  themeColor: "#56c232",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
