import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { formatOrderDate, OrderStatusBadge } from "@/components/account/order-display";
import { AccountPageHeader } from "@/components/account/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { defaultLocale } from "@/lib/i18n";
import { getCustomerOrders } from "@/lib/shopify/operations/customer";
import { formatPrice } from "@/lib/utils";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  const t = await getTranslations("account");

  return (
    <>
      <AccountPageHeader title={t("orders")} description={t("ordersDescription")} />
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  const [params, t] = await Promise.all([searchParams, getTranslations("account")]);
  const { orders, pageInfo } = await getCustomerOrders({
    after: params.after,
    before: params.before,
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${encodeURIComponent(order.id)}`}
              className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="grid gap-1">
                <span className="font-medium">{order.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatOrderDate(order.processedAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.fulfillmentStatus} />
                <span className="text-sm tabular-nums">
                  {formatPrice(
                    Number(order.totalPrice.amount),
                    order.totalPrice.currencyCode,
                    defaultLocale,
                  )}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {pageInfo.hasNextPage || pageInfo.hasPreviousPage ? (
        <div className="flex items-center justify-between">
          {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders?before=${encodeURIComponent(pageInfo.startCursor)}`}>
                {t("newerOrders")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders?after=${encodeURIComponent(pageInfo.endCursor)}`}>
                {t("olderOrders")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-[4.5rem] w-full rounded-lg" />
      ))}
    </div>
  );
}
