import { Suspense } from "react";

import { getCustomerOrders } from "@/lib/shopify/operations/customer";

export default function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  return (
    <Suspense fallback={<div data-loading data-storefront-canvas="account-orders" />}>
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  const params = await searchParams;
  const { orders, pageInfo } = await getCustomerOrders({
    after: params.after,
    before: params.before,
  });

  return (
    <div
      data-has-next-page={pageInfo.hasNextPage}
      data-has-previous-page={pageInfo.hasPreviousPage}
      data-order-count={orders.length}
      data-storefront-canvas="account-orders"
    />
  );
}
