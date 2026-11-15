import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { PwaManager } from "@/components/pwa/PwaManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoCidadão - Zeladoria Urbana",
  description: "Ciência Cidadã e Inteligência Geoespacial para Zeladoria Urbana Colaborativa sem burocracia.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EcoCidadão",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EcoCidadão" />
        <meta name="application-name" content="EcoCidadão" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="bg-background text-foreground antialiased select-none overscroll-none">
        <ThemeProvider>
          {children}
          <PwaManager />
        </ThemeProvider>
      </body>
    </html>
  );
}
