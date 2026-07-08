import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, Oswald } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/app/providers";
import { AppShell } from "@/components/app/app-shell";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

const cloudflareWebAnalyticsToken =
  process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" });

// Condensed display face for matchday/scoreboard headings.
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Reta Fútbol · Manager estilo FIFA para tu reta",
    template: "%s",
  },
  description:
    "Organiza tu reta como un club: crea jugadores con stats FIFA, arma equipos balanceados por overall y posición, lleva el marcador en vivo y guarda el registro de partidos y goleadores.",
  applicationName: "Reta Fútbol",
  keywords: [
    "reta",
    "fútbol",
    "cascarita",
    "armar equipos",
    "equipos balanceados",
    "FIFA",
    "manager de fútbol",
    "marcador en vivo",
    "goleadores",
    "fútbol amateur",
  ],
  authors: [{ name: "La Reta" }, {name: "Luis Alvarez"}],
  creator: "Luis Alvarez",
  publisher: "La Reta",
  category: "sports",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "Reta Fútbol",
    title: "Reta Fútbol · Manager estilo FIFA para tu reta",
    description:
      "Crea jugadores con stats FIFA, arma equipos parejos y lleva el marcador en vivo. El club de la reta en modo carrera.",
    url: "/",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reta Fútbol · Manager estilo FIFA para tu reta",
    description:
      "Crea jugadores con stats FIFA, arma equipos parejos y lleva el marcador en vivo.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: { capable: true, title: "Reta Fútbol" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        raleway.variable,
        oswald.variable,
      )}
    >
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-center" />
        </Providers>
        {cloudflareWebAnalyticsToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({
              token: cloudflareWebAnalyticsToken,
            })}
          />
        ) : null}
        <Analytics />
      </body>
    </html>
  );
}
