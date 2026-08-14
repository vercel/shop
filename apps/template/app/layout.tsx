import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { ActionBar } from "@/components/action-bar";
import { AgentButton } from "@/components/agent/agent-button";
import { AnalyticsComponents } from "@/components/analytics";
import { CartProviderWrapper } from "@/components/cart/context";
import { CartNotifications } from "@/components/cart/notifications";
import { CartOverlayBridge } from "@/components/cart/overlay-bridge";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteSchema } from "@/components/schema/site-schema";
import { Toaster } from "@/components/ui/sonner";
import { seedCartData } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, messages, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("accessibility"),
  ]);

  // Un-awaited: the promise streams to the client provider; never block the shell on it.
  const cartData = seedCartData();

  return (
    <html lang={locale}>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-foreground focus:outline-none"
        >
          {t("skipToContent")}
        </a>
        <SiteSchema locale={locale} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProviderWrapper cartData={cartData}>
            <Nav locale={locale} />
            <main id="main-content" className="flex flex-1 flex-col min-w-0">
              {children}
            </main>
            <Footer locale={locale} />
            <CartNotifications />
            <CartOverlayBridge />
            <Suspense>
              <ActionBar>{shopConfig.agent.isEnabled && <AgentButton />}</ActionBar>
            </Suspense>
          </CartProviderWrapper>
          <Toaster closeButton />
        </NextIntlClientProvider>
        <Suspense>
          <AnalyticsComponents locale={locale} />
        </Suspense>
      </body>
    </html>
  );
}

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("seo");

  return {
    alternates: buildAlternates({ pathname: "/" }),
    description: t("defaultDescription", { name: shopConfig.site.name }),
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
