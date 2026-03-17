import {
  OrderDeliverySection,
  OrderDetailSkeleton,
  OrderPackageSection,
  OrderProgressSection,
} from "@/components/orders/order-detail";

import { AccountPageHeader } from "@/components/account/page-header";
import { getLocale } from "@/lib/params";
import { getOrder } from "@/lib/shopify/operations/customer";
import { getOrderStatusInfo } from "@/lib/utils/order";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/server";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("orderDetail") };
}

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailContent paramsPromise={params} />
    </Suspense>
  );
}

async function OrderDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const [{ id: orderId }, locale, session, t] = await Promise.all([
    paramsPromise,
    getLocale(),
    requireSession(),
    getTranslations("orders"),
  ]);

  const order = await getOrder(
    session.accessToken,
    decodeURIComponent(orderId),
  );

  if (!order) {
    notFound();
  }

  const statusInfo = getOrderStatusInfo(order, t, locale);
  const itemCount = order.lineItems.reduce((sum, li) => sum + li.quantity, 0);

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader
        breadcrumbs={[
          { label: t("breadcrumb.settings") },
          { label: t("breadcrumb.orders"), href: "/account/orders" },
          { label: t("breadcrumb.detail") },
        ]}
        title={t("orderDetail")}
        titleSuffix={
          <span className="text-3xl font-semibold tracking-tight text-muted-foreground">
            {order.name}
          </span>
        }
      />

      <OrderProgressSection order={order} statusInfo={statusInfo} t={t} />
      <OrderPackageSection
        order={order}
        itemCount={itemCount}
        t={t}
        locale={locale}
      />
      <OrderDeliverySection order={order} t={t} />
    </div>
  );
}
