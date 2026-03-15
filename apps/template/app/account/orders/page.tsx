import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@/components/account/page-header";
import {
  OrderCard,
  OrderCardBadge,
  OrderCardContent,
  OrderCardDetails,
  OrderCardHeader,
  OrderCardImages,
  OrderCardItemCount,
  OrderCardProductList,
  OrderCardTitle,
} from "@/components/orders/order-card";
import {
  type FilterTab,
  OrderFiltersComposed,
} from "@/components/orders/order-filters";
import { requireSession } from "@/lib/auth/server";
import { getLocale } from "@/lib/params";
import { getOrders } from "@/lib/shopify/operations/customer";
import type { Order } from "@/lib/shopify/types/customer";
import {
  filterOrders,
  getOrderDateLabel,
  getOrderStatusLabel,
  getOrderStatusVariant,
  isOrderCancelled,
  isOrderCompleted,
} from "@/lib/utils/order";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("title") };
}

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("orders"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader
        breadcrumbs={[
          { label: t("breadcrumb.settings") },
          { label: t("title") },
        ]}
        title={t("title")}
        actions={
          <Suspense fallback={<OrderFiltersLoading />}>
            <OrderFiltersComposed />
          </Suspense>
        }
      />

      <Suspense fallback={<OrdersListLoading />}>
        <OrdersList searchParams={searchParams} locale={locale} />
      </Suspense>
    </div>
  );
}

async function OrdersList({
  searchParams,
  locale,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
  locale: string;
}) {
  const [{ status, q: query }, t, { orders }] = await Promise.all([
    searchParams,
    getTranslations("orders"),
    requireSession().then((session) =>
      getOrders(session.accessToken, { first: 50 }),
    ),
  ]);

  const filteredOrders = filterOrders(orders, status as FilterTab, query);

  if (filteredOrders.length === 0) {
    return <EmptyOrdersState />;
  }

  const inProgressOrders = filteredOrders.filter(
    (o) => !isOrderCompleted(o) && !isOrderCancelled(o),
  );
  const completedOrders = filteredOrders.filter((o) => isOrderCompleted(o));
  const cancelledOrders = filteredOrders.filter((o) => isOrderCancelled(o));

  return (
    <div className="flex flex-col gap-10">
      {inProgressOrders.length > 0 && (
        <OrderSection
          title={t("inProgress")}
          orders={inProgressOrders}
          locale={locale}
        />
      )}
      {completedOrders.length > 0 && (
        <OrderSection
          title={t("completed")}
          orders={completedOrders}
          locale={locale}
        />
      )}
      {cancelledOrders.length > 0 && (
        <OrderSection
          title={t("cancelled")}
          orders={cancelledOrders}
          locale={locale}
        />
      )}
    </div>
  );
}

function OrderSection({
  title,
  orders,
  locale,
}: {
  title: string;
  orders: Order[];
  locale: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 p-3">
        <span className="text-lg font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCardWrapper key={order.id} order={order} locale={locale} />
        ))}
      </div>
    </div>
  );
}

async function OrderCardWrapper({
  order,
  locale,
}: {
  order: Order;
  locale: string;
}) {
  const t = await getTranslations("orders");
  const images = order.lineItems
    .filter((li): li is typeof li & { image: NonNullable<typeof li.image> } =>
      Boolean(li.image),
    )
    .map((li) => ({
      src: li.image.url,
      alt: li.image.altText || li.title,
    }));

  const productNames = order.lineItems.map((li) => li.title);
  const itemCount = order.lineItems.reduce((sum, li) => sum + li.quantity, 0);
  const statusVariant = getOrderStatusVariant(order);
  const statusLabel = getOrderStatusLabel(order, t);
  const dateLabel = getOrderDateLabel(order, t, locale);

  return (
    <Link href={`/account/orders/${encodeURIComponent(order.id)}`}>
      <OrderCard>
        <OrderCardImages images={images} />
        <OrderCardContent>
          <OrderCardHeader>
            {statusLabel && (
              <OrderCardBadge variant={statusVariant}>
                {statusLabel}
              </OrderCardBadge>
            )}
            <OrderCardTitle>{dateLabel}</OrderCardTitle>
          </OrderCardHeader>
          <OrderCardDetails>
            <OrderCardItemCount count={itemCount} />
            <OrderCardProductList products={productNames} />
          </OrderCardDetails>
        </OrderCardContent>
      </OrderCard>
    </Link>
  );
}

async function EmptyOrdersState() {
  const t = await getTranslations("orders");
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="text-lg font-medium text-muted-foreground">
        {t("noOrdersFound")}
      </div>
      <p className="text-sm text-foreground/50">{t("noOrdersDescription")}</p>
    </div>
  );
}

function OrderFiltersLoading() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="h-9 w-full sm:w-[180px] animate-pulse bg-gray-100 rounded-md" />
      <div className="h-10 w-full sm:w-48 animate-pulse bg-gray-100 rounded-full" />
    </div>
  );
}

function OrdersListLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="h-6 w-24 animate-pulse bg-gray-100 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-row gap-6 p-3 rounded-xl border">
            <div className="flex flex-row gap-1">
              <div className="size-[72px] animate-pulse bg-gray-100 rounded-md" />
              <div className="flex flex-col gap-1">
                <div className="size-[34px] animate-pulse bg-gray-100 rounded-md" />
                <div className="size-[34px] animate-pulse bg-gray-100 rounded-md" />
              </div>
            </div>
            <div className="flex flex-col gap-4 py-3 px-2 flex-1">
              <div className="flex flex-col gap-3">
                <div className="h-6 w-28 animate-pulse bg-gray-100 rounded-full" />
                <div className="h-6 w-48 animate-pulse bg-gray-100 rounded" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-4 w-16 animate-pulse bg-gray-100 rounded" />
                <div className="h-4 w-64 animate-pulse bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
