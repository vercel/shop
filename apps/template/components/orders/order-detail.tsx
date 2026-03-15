import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Order, OrderLineItem } from "@/lib/shopify/types/customer";
import type { OrderStatusInfo, TranslationFn } from "@/lib/utils/order";
import { formatAddress, formatMoney } from "@/lib/utils/order";
import { OrderProgressComposed } from "./order-progress-client";

export function OrderProgressSection({
  order,
  statusInfo,
  t,
}: {
  order: Order;
  statusInfo: OrderStatusInfo;
  t: TranslationFn;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-end justify-between px-4">
        <span className="text-sm font-medium text-foreground/50">
          {statusInfo.label}
        </span>
        <div className="flex flex-row gap-3">
          {order.fulfillments[0]?.trackingUrl && (
            <Link
              href={order.fulfillments[0].trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-normal text-secondary-foreground hover:underline"
            >
              {order.fulfillments[0].trackingCompany
                ? t("trackingPage", {
                    company: order.fulfillments[0].trackingCompany,
                  })
                : t("trackingPageFallback")}
              <ExternalLinkIcon className="size-3" />
            </Link>
          )}
          <Link
            href={order.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-normal text-secondary-foreground hover:underline"
          >
            {t("needHelp")}
          </Link>
        </div>
      </div>

      <div className="flex flex-row gap-0 rounded-xl border border-ring bg-white p-1.5">
        <div className="flex items-center justify-center rounded-md border border-black/5 bg-input p-3">
          {order.lineItems[0]?.image && (
            <Image
              src={order.lineItems[0].image.url}
              alt={order.lineItems[0].title}
              width={80}
              height={80}
              className="size-20 rounded-md object-contain"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-6 px-4 pb-3 pt-1.5">
          <div className="flex flex-col gap-3">
            {statusInfo.badgeText && (
              <div
                className="inline-flex w-fit items-center gap-[7px] rounded-[119px] border px-[7px]"
                style={{ backgroundColor: statusInfo.badgeColor }}
              >
                <span
                  className="text-sm font-normal"
                  style={{ color: statusInfo.badgeTextColor }}
                >
                  {statusInfo.badgeText}
                </span>
              </div>
            )}
            <span className="text-xl font-medium text-foreground">
              {statusInfo.dateLabel}
            </span>
          </div>

          <OrderProgressComposed currentStatus={statusInfo.progressStatus} />
        </div>
      </div>
    </div>
  );
}

export function OrderPackageSection({
  order,
  itemCount,
  t,
  locale,
}: {
  order: Order;
  itemCount: number;
  t: TranslationFn;
  locale: string;
}) {
  return (
    <div className="flex flex-col gap-8 px-4">
      <div className="flex flex-row items-center gap-6">
        <span className="text-lg font-medium text-muted-foreground">
          {t("packageContent")}
        </span>
        <span className="text-base font-medium text-muted-foreground opacity-20">
          {t("itemCount", { count: itemCount })}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {order.lineItems.map((item) => (
          <OrderLineItemCard key={item.id} item={item} t={t} locale={locale} />
        ))}
      </div>
    </div>
  );
}

export function OrderDeliverySection({
  order,
  t,
}: {
  order: Order;
  t: TranslationFn;
}) {
  return (
    <div className="flex flex-col gap-8 p-3">
      <h2 className="text-3xl font-medium text-muted-foreground">
        {t("deliveryInformation")}
      </h2>

      <div className="flex flex-col gap-3 opacity-80">
        <div className="flex flex-col gap-1 pb-2">
          <span className="text-xs font-normal text-secondary-foreground opacity-40">
            {t("deliverTo")}
          </span>
          <span className="text-lg font-medium text-foreground">
            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-normal text-secondary-foreground opacity-40">
            {t("address")}
          </span>
          <span className="text-base font-normal text-foreground whitespace-pre-line">
            {order.shippingAddress?.formatted?.join("\n") ||
              formatAddress(order.shippingAddress, t)}
          </span>
        </div>
      </div>

      <div className="flex flex-row items-center gap-1">
        <span className="text-xs font-normal text-secondary-foreground opacity-50">
          {t("updateDeliveryInfo")}
        </span>
        <Link
          href={order.statusPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-normal text-secondary-foreground hover:underline"
        >
          {t("contactSupport")}
        </Link>
      </div>
    </div>
  );
}

function OrderLineItemCard({
  item,
  t,
  locale,
}: {
  item: OrderLineItem;
  t: TranslationFn;
  locale: string;
}) {
  return (
    <div className="flex flex-row gap-3">
      <div className="flex items-center justify-center rounded-[11px] border bg-muted">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.altText || item.title}
            width={80}
            height={80}
            className="size-20 rounded-[11px] object-contain"
          />
        ) : (
          <div className="size-20" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-6 px-2 py-3">
        <div className="flex flex-row items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {item.title}
            </span>
            {item.variantTitle && (
              <span className="text-sm font-semibold text-black opacity-30">
                {item.variantTitle}
              </span>
            )}
          </div>
          <span className="text-lg font-semibold text-black">
            {formatMoney(item.discountedTotalPrice, locale)}
          </span>
        </div>
        <span className="text-sm font-medium text-black opacity-30">
          {t("unitCount", { count: item.quantity })}
        </span>
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex flex-row gap-4">
          <div className="h-12 w-48 animate-pulse rounded bg-gray-100" />
          <div className="h-12 w-32 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between px-4">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex rounded-xl border p-4">
          <div className="size-20 animate-pulse rounded-md bg-gray-100" />
          <div className="flex flex-1 flex-col gap-6 px-4">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
            <div className="flex gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="size-3 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 px-4">
        <div className="h-6 w-36 animate-pulse rounded bg-gray-100" />
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-20 animate-pulse rounded-[11px] bg-gray-100" />
              <div className="flex flex-1 flex-col gap-4 py-3">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
