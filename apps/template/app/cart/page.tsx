import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Empty } from "@/components/cart-page/empty-cart";
import { Header } from "@/components/cart-page/header";
import { CartItemsList } from "@/components/cart-page/cart-items-list";
import { PageSkeleton } from "@/components/cart-page/skeletons";
import { Summary } from "@/components/cart-page/summary";
import { RelatedProductsSection } from "@/components/pdp/related-products-section";
import { CartContextSync } from "@/components/cart/context-sync";
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
              <div className="flex-1 min-w-0 px-5 sm:px-5 lg:px-10 xl:px-10 py-10 lg:py-10">
                <Header locale={locale} />
                <CartItemsList locale={locale} />
                {cart.lines[0]?.merchandise.product.handle ? (
                  <div className="mt-12 pt-10 border-t border-border">
                    <RelatedProductsSection
                      handle={cart.lines[0].merchandise.product.handle}
                      locale={locale}
                    />
                  </div>
                ) : null}
              </div>

              <aside className="hidden lg:block shrink-0">
                <div className="w-95 xl:w-105 2xl:w-120 min-h-full bg-input/50 rounded-tl-3xl shadow-[100vw_0_0_0_rgba(236,236,236,0.5)]">
                  <div className="sticky top-0 p-10">
                    <Summary locale={locale} />
                  </div>
                </div>
              </aside>
            </div>

            <div className="lg:hidden bg-input/50 px-5 py-5">
              <Summary locale={locale} />
            </div>
          </>
        )}
      </CartContextSync>
    </NextIntlClientProvider>
  );
}
