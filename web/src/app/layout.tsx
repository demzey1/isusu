import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import { AgenticWalletField } from "@/components/agentic-wallet";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";
import { Providers } from "./providers";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Isusu: save together, take turns",
  description:
    "Rotating savings circles settled in USDT. Everyone pays the same, everyone takes the pot once, and the terms cannot change.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh bg-cream text-ink">
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <AgenticWalletField />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
