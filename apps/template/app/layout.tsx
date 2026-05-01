import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { ActionBar } from "@/components/action-bar";
import { AgentButton } from "@/components/agent/agent-button";
import { AnalyticsComponents } from "@/components/analytics";
import { CartProvider } from "@/components/cart/context";
import { CartOverlayWithAddress } from "@/components/cart/overlay-with-address";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { SiteSchema } from "@/components/schema/site-schema";
import { siteConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, messages, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("accessibility"),
  ]);

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
          <CartProvider initialCart={null}>
            <Nav locale={locale} />
            <main id="main-content" className="flex flex-1 flex-col min-w-0">
              {children}
            </main>
            <Footer locale={locale} />
            <Suspense>
              <CartOverlayWithAddress locale={locale} />
            </Suspense>
            <Suspense>
              <ActionBar>{process.env.AI_AGENT_DISABLED ? null : <AgentButton />}</ActionBar>
            </Suspense>
          </CartProvider>
        </NextIntlClientProvider>
        <AnalyticsComponents />
      </body>
    </html>
  );
}

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("seo");

  return {
    alternates: buildAlternates({ pathname: "/" }),
    description: t("defaultDescription"),
    generator: "Vercel Shop",
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
  };
};
