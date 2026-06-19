import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CartView, CartViewFallback } from "@/components/storefront/cart-view";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";
import { withFallback } from "@/lib/shopify/errors";
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
    <Suspense fallback={<CartViewFallback locale={locale} />}>
      <CartContent locale={locale} />
    </Suspense>
  );
}

async function CartContent({ locale }: { locale: Locale }) {
  const cart = await withFallback(getCart(), undefined);
  return <CartView cart={cart ?? null} locale={locale} />;
}
