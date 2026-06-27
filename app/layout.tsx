import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, Oswald } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";

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

export const metadata: Metadata = {
  title: "Reta Fútbol · Manager",
  description:
    "Dashboard estilo FIFA para organizar la reta: jugadores, stats y equipos balanceados.",
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
      </body>
    </html>
  );
}
