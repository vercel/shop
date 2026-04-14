import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CartContextSync } from "@/components/cart/context-sync";
import { Empty } from "@/components/cart/empty-cart";
import { Header } from "@/components/cart/header";
import { ItemsSection } from "@/components/cart/items-section";
import { PageSkeleton } from "@/components/cart/skeletons";
import { Summary } from "@/components/cart/summary";
import { Upsells } from "@/components/cart/upsell-recommendations";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { getCart } from "@/lib/shopify/operations/cart";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CartPage() {
  const locale = await getLocale();

  return (
    <main className="min-h-screen">
      <Suspense fallback={<PageSkeleton />}>
        <CartContent locale={locale} />
      </Suspense>
    </main>
  );
}

async function CartContent({ locale }: { locale: Locale }) {
  const [cart, messages] = await Promise.all([getCart(), getMessages()]);

  return (
    <NextIntlClientProvider messages={{ cart: messages.cart }}>
      <CartContextSync cart={cart ?? null}>
        {!cart || cart.totalQuantity === 0 ? (
          <Empty />
        ) : (
          <>
            <div className="flex min-h-screen overflow-x-clip">
              <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-12 xl:px-16 py-8 lg:py-12">
                <Header locale={locale} />
                <ItemsSection locale={locale} />
                <Upsells
                  locale={locale}
                  firstItemHandle={cart.lines[0]?.merchandise.product.handle}
                />
              </div>

              <aside className="hidden lg:block shrink-0">
                <div className="w-95 xl:w-105 2xl:w-120 min-h-full bg-input/50 rounded-tl-3xl shadow-[100vw_0_0_0_rgba(236,236,236,0.5)]">
                  <div className="sticky top-0 p-8">
                    <Summary locale={locale} />
                  </div>
                </div>
              </aside>
            </div>

            <div className="lg:hidden bg-input/50 px-4 py-6">
              <Summary locale={locale} />
            </div>
          </>
        )}
      </CartContextSync>
    </NextIntlClientProvider>
  );
}
