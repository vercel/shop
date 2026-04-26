import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CartItemsList } from "@/components/cart-page/cart-items-list";
import { Empty } from "@/components/cart-page/empty-cart";
import { Header } from "@/components/cart-page/header";
import { PageSkeleton } from "@/components/cart-page/skeletons";
import { Summary } from "@/components/cart-page/summary";
import { CartContextSync } from "@/components/cart/context-sync";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Sections } from "@/components/ui/sections";
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
    <main>
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
          <Container className="py-10">
            <Sections>
              <Header />
              <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-9">
                  <CartItemsList locale={locale} />
                </div>
                <aside className="lg:col-span-3">
                  <div className="lg:sticky lg:top-20">
                    <Summary locale={locale} />
                  </div>
                </aside>
              </div>
              {cart.lines[0]?.merchandise.product.handle ? (
                <RelatedProductsSection
                  handle={cart.lines[0].merchandise.product.handle}
                  locale={locale}
                />
              ) : null}
            </Sections>
          </Container>
        )}
      </CartContextSync>
    </NextIntlClientProvider>
  );
}
