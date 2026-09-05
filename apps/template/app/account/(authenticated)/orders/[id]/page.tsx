import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  formatOrderDate,
  humanizeStatus,
  OrderStatusBadge,
} from "@/components/account/order-display";
import { AccountPageHeader } from "@/components/account/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shopConfig } from "@/lib/config";
import { getCustomerOrder } from "@/lib/shopify/operations/customer";
import type { Money, OrderLineItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
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
    <>
      <AccountPageHeader title={order.name} description={formatOrderDate(order.processedAt)} />

      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.fulfillmentStatus} />
        {order.financialStatus ? (
          <Badge variant="outline">{humanizeStatus(order.financialStatus)}</Badge>
        ) : null}
      </div>

      <ul className="grid divide-y rounded-lg border">
        {order.lineItems.map((item, index) => (
          <OrderLineItemRow key={index} item={item} />
        ))}
      </ul>

      <dl className="grid gap-2 rounded-lg border p-4 text-sm">
        <SummaryRow label="Subtotal" money={order.subtotal} />
        <SummaryRow label="Shipping" money={order.totalShipping} />
        <SummaryRow label="Tax" money={order.totalTax} />
        <div className="flex items-center justify-between border-t pt-2 font-medium">
          <dt>Total</dt>
          <dd className="font-mono tabular-nums">
            {formatPrice(order.totalPrice, shopConfig.localization.locale)}
          </dd>
        </div>
      </dl>

      {order.shippingAddress && order.shippingAddress.formatted.length > 0 ? (
        <div className="grid gap-2 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Shipping address</h2>
          <address className="text-sm text-muted-foreground not-italic">
            {order.shippingAddress.formatted.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={order.statusPageUrl} target="_blank" rel="noopener noreferrer">
            View order status
          </a>
        </Button>
      </div>
    </>
  );
}

function OrderLineItemRow({ item }: { item: OrderLineItem }) {
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.altText}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        {item.variantTitle ? (
          <p className="truncate text-xs text-muted-foreground">{item.variantTitle}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
      </div>
      {item.totalPrice ? (
        <span className="font-mono text-sm tabular-nums">
          {formatPrice(item.totalPrice, shopConfig.localization.locale)}
        </span>
      ) : null}
    </li>
  );
}

function SummaryRow({ label, money }: { label: string; money: Money | null }) {
  if (!money) return null;
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">
        {formatPrice(money, shopConfig.localization.locale)}
      </dd>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
