import type { Metadata } from "next";
import { Suspense } from "react";

import { CartViewedTracker } from "@/components/analytics/trackers";
import { CartPageBody } from "@/components/cart-page/body";
import { PageSkeleton } from "@/components/cart-page/skeletons";

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
    <>
      <CartViewedTracker />
      <Suspense fallback={<PageSkeleton />}>
        <CartPageBody />
      </Suspense>
    </>
  );
}
