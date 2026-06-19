import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AnalyticsComponents } from "@/components/analytics";
import { CartBootstrap } from "@/components/cart/bootstrap";
import { CartProvider } from "@/components/cart/context";
import { SiteSchema } from "@/components/schema/site-schema";
import { siteConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import { buildAlternates } from "@/lib/seo";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, messages, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("accessibility"),
  ]);

  return (
    <html lang={locale}>
      <head />
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-background focus:px-5 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-foreground focus:outline-none"
        >
          {t("skipToContent")}
        </a>
        <SiteSchema locale={locale} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider initialCart={null}>
            <Suspense fallback={null}>
              <CartBootstrap />
            </Suspense>
            <main id="main-content">{children}</main>
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
    description: t("defaultDescription", { name: siteConfig.name }),
    generator: siteConfig.name,
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
