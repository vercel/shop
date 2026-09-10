import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../globals.css";
import { type CSSProperties, Suspense } from "react";

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
import { TEAMS } from "@/lib/tenant";
import { getTeam } from "@/lib/tenant/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return Object.keys(TEAMS).map((team) => ({ team }));
}

export default async function RootLayout({ children }: LayoutProps<"/[team]">) {
  const team = await getTeam();
  // Un-awaited: the promise streams to the client provider; never block the shell on it.
  const cartData = seedCartData();
  return (
    <html lang={shopConfig.localization.locale}>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
        data-team={team.id}
        style={
          {
            "--primary": team.ctaColor,
            "--primary-foreground": team.ctaForeground,
          } as CSSProperties
        }
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-foreground focus:outline-none"
        >
          Skip to content
        </a>
        <SiteSchema />

        <CartProviderWrapper cartData={cartData}>
          <Nav name={team.name} />
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
  const team = await getTeam();
  return {
    alternates: buildAlternates({ pathname: "/" }),
    description: team.description,
    generator: shopConfig.site.name,
    metadataBase: new URL(shopConfig.site.url),
    openGraph: {
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    title: {
      default: team.name,
      template: `%s | ${team.name}`,
    },
  };
};
