import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Suspense } from "react";

import { ActionBar } from "@/components/action-bar";
import { AgentButton } from "@/components/agent/agent-button";
import { AnalyticsComponents } from "@/components/analytics";
import { CartUI } from "@/components/cart/cart-ui";
import { CartProviderWrapper } from "@/components/cart/context";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteSchema } from "@/components/schema/site-schema";
import { Toaster } from "@/components/ui/sonner";
import { seedCartData } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Un-awaited: the promise streams to the client provider; never block the shell on it.
  const cartData = seedCartData();
  return (
    <html lang={shopConfig.localization.locale}>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-foreground focus:outline-none"
        >
          Skip to content
        </a>
        <SiteSchema />

        <CartProviderWrapper cartData={cartData}>
          <Nav />
          <main id="main-content" className="flex flex-1 flex-col min-w-0">
            {children}
          </main>
          <Footer />
          <CartUI />
          <Suspense>
            <ActionBar>{shopConfig.agent.isEnabled && <AgentButton />}</ActionBar>
          </Suspense>
          <Suspense>
            <AnalyticsComponents />
          </Suspense>
        </CartProviderWrapper>
        <Toaster closeButton />
      </body>
    </html>
  );
}

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    alternates: buildAlternates({ pathname: "/" }),
    description: `Shop premium products, curated collections, and latest offers from ${shopConfig.site.name}.`,
    generator: shopConfig.site.name,
    metadataBase: new URL(shopConfig.site.url),
    openGraph: {
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    title: {
      default: shopConfig.site.name,
      template: `%s | ${shopConfig.site.name}`,
    },
  };
};
