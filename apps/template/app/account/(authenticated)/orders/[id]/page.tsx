import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getCustomerOrder } from "@/lib/shopify/operations/customer";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div data-loading data-storefront-canvas="account-order" />}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) notFound();

  const order = await getCustomerOrder(id);
  if (!order) notFound();

  return (
    <div
      data-line-item-count={order.lineItems.length}
      data-order-id={order.id}
      data-storefront-canvas="account-order"
    />
  );
}
