import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CartViewedTracker } from "@/components/analytics/trackers";
import { CartPageBody } from "@/components/cart-page/body";
import { PageSkeleton } from "@/components/cart-page/skeletons";

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
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ cart: messages.cart }}>
      <CartPageBody />
    </NextIntlClientProvider>
  );
}
