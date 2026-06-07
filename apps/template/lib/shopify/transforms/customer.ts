import type {
  CustomerAddress,
  CustomerOrder,
  CustomerOrderSummary,
  CustomerProfile,
  Image,
  Money,
  OrderLineItem,
} from "@/lib/types";

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyImage {
  altText: string | null;
  height: number | null;
  url: string;
  width: number | null;
}

export interface ShopifyCustomerAddress {
  address1: string | null;
  address2: string | null;
  city: string | null;
  company: string | null;
  firstName: string | null;
  formatted: string[];
  id: string;
  lastName: string | null;
  phoneNumber: string | null;
  territoryCode: string | null;
  zip: string | null;
  zoneCode: string | null;
}

interface ShopifyLineItem {
  image: ShopifyImage | null;
  quantity: number;
  title: string;
  totalPrice: ShopifyMoney | null;
  variantTitle: string | null;
}

export interface ShopifyOrderSummary {
  financialStatus: string | null;
  fulfillmentStatus: string;
  id: string;
  name: string;
  number: number;
  processedAt: string;
  totalPrice: ShopifyMoney;
}

export interface ShopifyOrder extends ShopifyOrderSummary {
  lineItems: { nodes: ShopifyLineItem[] };
  shippingAddress: ShopifyCustomerAddress | null;
  statusPageUrl: string;
  subtotal: ShopifyMoney | null;
  totalShipping: ShopifyMoney | null;
  totalTax: ShopifyMoney | null;
}

export interface ShopifyCustomerProfile {
  emailAddress: { emailAddress: string } | null;
  firstName: string | null;
  lastName: string | null;
}

function transformMoney(money: ShopifyMoney): Money {
  return { amount: money.amount, currencyCode: money.currencyCode };
}

function transformImage(image: ShopifyImage | null): Image | null {
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
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    company: address.company,
    firstName: address.firstName,
    formatted: address.formatted,
    id: address.id,
    isDefault: defaultAddressId != null && address.id === defaultAddressId,
    lastName: address.lastName,
    phoneNumber: address.phoneNumber,
    territoryCode: address.territoryCode,
    zip: address.zip,
    zoneCode: address.zoneCode,
  };
}

export function transformOrderSummary(order: ShopifyOrderSummary): CustomerOrderSummary {
  return {
    financialStatus: order.financialStatus,
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
    variantTitle: item.variantTitle,
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
    firstName: customer.firstName,
    lastName: customer.lastName,
  };
}
