import type { CustomerAccountResultOf } from "@/lib/shopify/customer-account";
import type {
  ADDRESS_FRAGMENT,
  CUSTOMER_PROFILE_FRAGMENT,
  ORDER_FRAGMENT,
  ORDER_SUMMARY_FRAGMENT,
} from "@/lib/shopify/customer-account-fragments";
import type {
  CustomerAddress,
  CustomerOrder,
  CustomerOrderSummary,
  CustomerProfile,
  Image,
  Money,
  OrderLineItem,
} from "@/lib/types";

export type ShopifyCustomerAddress = CustomerAccountResultOf<typeof ADDRESS_FRAGMENT>;
export type ShopifyOrderSummary = CustomerAccountResultOf<typeof ORDER_SUMMARY_FRAGMENT>;
export type ShopifyOrder = CustomerAccountResultOf<typeof ORDER_FRAGMENT>;
export type ShopifyCustomerProfile = CustomerAccountResultOf<typeof CUSTOMER_PROFILE_FRAGMENT>;
type ShopifyLineItem = ShopifyOrder["lineItems"]["nodes"][number];
type ShopifyImage = NonNullable<ShopifyLineItem["image"]>;
type ShopifyMoney = ShopifyOrderSummary["totalPrice"];

function transformMoney(money: ShopifyMoney): Money {
  return { amount: money.amount, currencyCode: money.currencyCode };
}

function transformImage(image: ShopifyImage | null | undefined): Image | null {
  if (!image) return null;
  return {
    altText: image.altText ?? "",
    height: image.height ?? 0,
    url: image.url,
    width: image.width ?? 0,
  };
}

export function transformCustomerAddress(
  address: ShopifyCustomerAddress,
  defaultAddressId?: string | null,
): CustomerAddress {
  return {
    address1: address.address1 ?? null,
    address2: address.address2 ?? null,
    city: address.city ?? null,
    company: address.company ?? null,
    firstName: address.firstName ?? null,
    formatted: address.formatted,
    id: address.id,
    isDefault: defaultAddressId != null && address.id === defaultAddressId,
    lastName: address.lastName ?? null,
    phoneNumber: address.phoneNumber ?? null,
    territoryCode: address.territoryCode ?? null,
    zip: address.zip ?? null,
    zoneCode: address.zoneCode ?? null,
  };
}

export function transformOrderSummary(order: ShopifyOrderSummary): CustomerOrderSummary {
  return {
    financialStatus: order.financialStatus ?? null,
    fulfillmentStatus: order.fulfillmentStatus,
    id: order.id,
    name: order.name,
    number: order.number,
    processedAt: order.processedAt,
    totalPrice: transformMoney(order.totalPrice),
  };
}

function transformLineItem(item: ShopifyLineItem): OrderLineItem {
  return {
    image: transformImage(item.image),
    quantity: item.quantity,
    title: item.title,
    totalPrice: item.totalPrice ? transformMoney(item.totalPrice) : null,
    variantTitle: item.variantTitle ?? null,
  };
}

export function transformOrder(order: ShopifyOrder): CustomerOrder {
  return {
    ...transformOrderSummary(order),
    lineItems: order.lineItems.nodes.map(transformLineItem),
    shippingAddress: order.shippingAddress ? transformCustomerAddress(order.shippingAddress) : null,
    statusPageUrl: order.statusPageUrl,
    subtotal: order.subtotal ? transformMoney(order.subtotal) : null,
    totalShipping: order.totalShipping ? transformMoney(order.totalShipping) : null,
    totalTax: order.totalTax ? transformMoney(order.totalTax) : null,
  };
}

export function transformCustomerProfile(customer: ShopifyCustomerProfile): CustomerProfile {
  return {
    email: customer.emailAddress?.emailAddress ?? "",
    firstName: customer.firstName ?? null,
    lastName: customer.lastName ?? null,
  };
}
