import type {
  OrderStatusVariant,
  FulfillmentStatus as ProgressFulfillmentStatus,
} from "@/components/orders";
import type { Money, Order } from "@/lib/shopify/types/customer";

// biome-ignore lint/suspicious/noExplicitAny: next-intl Translator has strict key types incompatible with plain string
export type TranslationFn = (key: any, values?: any) => string;

export function isOrderCompleted(order: Order): boolean {
  return order.fulfillmentStatus === "FULFILLED";
}

export function isOrderCancelled(order: Order): boolean {
  return !!order.cancelledAt;
}

export function getOrderStatusVariant(order: Order): OrderStatusVariant {
  if (isOrderCancelled(order)) {
    return "cancelled";
  }

  if (isOrderCompleted(order)) {
    return "delivered";
  }

  const fulfillment = order.fulfillments[0];
  if (fulfillment) {
    if (fulfillment.status === "IN_PROGRESS") {
      return "in-progress";
    }
  }

  return "received";
}

export function getOrderStatusLabel(
  order: Order,
  t: TranslationFn,
): string | null {
  if (isOrderCancelled(order)) {
    return null;
  }

  if (isOrderCompleted(order)) {
    return null;
  }

  const fulfillment = order.fulfillments[0];
  if (fulfillment) {
    if (fulfillment.status === "IN_PROGRESS") {
      return t("status.outForDelivery");
    }
  }

  return t("status.orderReceived");
}

export function getOrderDateLabel(
  order: Order,
  t: TranslationFn,
  locale: string,
): string {
  if (order.cancelledAt) {
    return t("status.cancelledDate", {
      date: formatDateShort(new Date(order.cancelledAt), locale),
    });
  }

  if (isOrderCompleted(order)) {
    const fulfillment = order.fulfillments[0];
    if (fulfillment?.deliveredAt) {
      return t("status.deliveredDate", {
        date: formatDateShort(new Date(fulfillment.deliveredAt), locale),
      });
    }
    return t("status.completedDate", {
      date: formatDateShort(new Date(order.processedAt), locale),
    });
  }

  const fulfillment = order.fulfillments[0];
  if (fulfillment?.estimatedDeliveryAt) {
    return t("status.expectedDate", {
      date: formatDateRange(new Date(fulfillment.estimatedDeliveryAt), locale),
    });
  }

  return t("status.orderedDate", {
    date: formatDateShort(new Date(order.processedAt), locale),
  });
}

export interface OrderStatusInfo {
  label: string;
  badgeText: string | null;
  badgeColor: string;
  badgeTextColor: string;
  dateLabel: string;
  progressStatus: ProgressFulfillmentStatus;
}

export function getOrderStatusInfo(
  order: Order,
  t: TranslationFn,
  locale: string,
): OrderStatusInfo {
  if (order.cancelledAt) {
    const cancelDate = new Date(order.cancelledAt);
    return {
      label: t("status.orderCancelled"),
      badgeText: null,
      badgeColor: "#797979",
      badgeTextColor: "#ffffff",
      dateLabel: t("status.cancelledDate", {
        date: formatDate(cancelDate, locale),
      }),
      progressStatus: "cancelled",
    };
  }

  if (order.fulfillmentStatus === "FULFILLED") {
    const fulfillment = order.fulfillments[0];
    const deliveredDate = fulfillment?.deliveredAt
      ? new Date(fulfillment.deliveredAt)
      : new Date(order.processedAt);
    return {
      label: t("status.orderDelivered"),
      badgeText: null,
      badgeColor: "#00ba5a",
      badgeTextColor: "#00ba5a",
      dateLabel: t("status.deliveredDate", {
        date: formatDate(deliveredDate, locale),
      }),
      progressStatus: "delivered",
    };
  }

  const fulfillment = order.fulfillments[0];

  if (fulfillment?.status === "IN_PROGRESS" && fulfillment.inTransitAt) {
    const estimatedDate = fulfillment.estimatedDeliveryAt
      ? new Date(fulfillment.estimatedDeliveryAt)
      : null;
    return {
      label: t("status.orderInProgress"),
      badgeText: t("status.outForDelivery"),
      badgeColor: "rgba(41, 134, 255, 0.15)",
      badgeTextColor: "#2986ff",
      dateLabel: estimatedDate
        ? t("status.expectedDate", {
            date: formatDateRange(estimatedDate, locale),
          })
        : t("status.outForDelivery"),
      progressStatus: "out_for_delivery",
    };
  }

  if (fulfillment?.trackingNumber) {
    const estimatedDate = fulfillment.estimatedDeliveryAt
      ? new Date(fulfillment.estimatedDeliveryAt)
      : null;
    return {
      label: t("status.orderInProgress"),
      badgeText: t("status.shipped"),
      badgeColor: "rgba(41, 134, 255, 0.15)",
      badgeTextColor: "#2986ff",
      dateLabel: estimatedDate
        ? t("status.expectedDate", {
            date: formatDateRange(estimatedDate, locale),
          })
        : t("status.shipped"),
      progressStatus: "shipped",
    };
  }

  const processedDate = new Date(order.processedAt);
  const estimatedDelivery = new Date(processedDate);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  return {
    label: t("status.orderInProgress"),
    badgeText: t("status.fastShipping"),
    badgeColor: "#00ba5a",
    badgeTextColor: "#00ba5a",
    dateLabel: t("status.expectedDate", {
      date: formatDateRange(estimatedDelivery, locale),
    }),
    progressStatus: "received",
  };
}

type FilterTab = "all" | "in_progress" | "completed" | "cancelled";

export function filterOrders(
  orders: Order[],
  status?: FilterTab,
  query?: string,
): Order[] {
  let filtered = orders;

  if (status && status !== "all") {
    filtered = filtered.filter((order) => {
      switch (status) {
        case "in_progress":
          return !isOrderCompleted(order) && !isOrderCancelled(order);
        case "completed":
          return isOrderCompleted(order);
        case "cancelled":
          return isOrderCancelled(order);
        default:
          return true;
      }
    });
  }

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter((order) => {
      if (order.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      if (order.orderNumber.toString().includes(lowerQuery)) {
        return true;
      }
      if (
        order.lineItems.some((li) =>
          li.title.toLowerCase().includes(lowerQuery),
        )
      ) {
        return true;
      }
      return false;
    });
  }

  return filtered;
}

export function formatMoney(money: Money, locale: string): string {
  const amount = Number.parseFloat(money.amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateRange(date: Date, locale: string): string {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return `${date.toLocaleDateString(locale, { month: "long", day: "numeric" })} - ${nextDay.toLocaleDateString(locale, { month: "long", day: "numeric" })}`;
}

export function formatAddress(
  address: Order["shippingAddress"],
  t: TranslationFn,
): string {
  if (!address) return t("noShippingAddress");
  const parts = [
    address.address1,
    address.address2,
    [address.city, address.province, address.zip].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter(Boolean);
  return parts.join("\n");
}
