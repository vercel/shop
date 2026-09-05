import type { Metadata } from "next";
import { Suspense } from "react";

import { CartViewedTracker } from "@/components/analytics/trackers";
import { CartItemsList } from "@/components/cart-page/cart-items-list";
import { Empty } from "@/components/cart-page/empty-cart";
import { Header } from "@/components/cart-page/header";
import { PageSkeleton } from "@/components/cart-page/skeletons";
import { Summary } from "@/components/cart-page/summary";
import { CartContextSync } from "@/components/cart/context";
import { CartWarnings } from "@/components/cart/warnings";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getCart } from "@/lib/cart/server";
import { shopConfig } from "@/lib/config";
import { withFallback } from "@/lib/shopify/errors";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cart",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function CartPage() {
  return (
    <main>
      <CartViewedTracker />
      <Suspense fallback={<PageSkeleton />}>
        <CartContent />
      </Suspense>
    </main>
  );
}

async function CartContent() {
  const cart = await withFallback(getCart(), undefined);
  return (
    <CartContextSync cart={cart ?? null}>
      {!cart || cart.totalQuantity === 0 ? (
        <Empty />
      ) : (
        <Page>
          <Container>
            <Sections>
              <Header title="Cart" />
              <CartWarnings />
              <div className="grid gap-5 lg:grid-cols-12">
                <div className="lg:col-span-8 xl:col-span-9">
                  <CartItemsList emptyLabel="Your cart is empty" itemsLabel="Cart items" />
                </div>
                <aside className="lg:col-span-4 xl:col-span-3">
                  <div className="lg:sticky lg:top-20">
                    <Summary
                      completeCheckoutLabel="Go to Checkout"
                      estimatedTotalLabel="Estimated total"
                      taxesAndShippingNote="Taxes and shipping calculated at checkout."
                      updatingCartLabel="Updating cart..."
                    />
                  </div>
                </aside>
              </div>
              {shopConfig.pdp.relatedProducts.isEnabled &&
              cart.lines.nodes[0]?.merchandise?.product.handle ? (
                <RelatedProductsSection
                  handle={cart.lines.nodes[0].merchandise.product.handle}
                  limit={4}
                />
              ) : null}
            </Sections>
          </Container>
        </Page>
      )}
    </CartContextSync>
  );
}
