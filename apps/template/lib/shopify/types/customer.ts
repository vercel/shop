/**
 * TypeScript types for Shopify Customer Account API
 * API Version: 2025-01
 */

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  defaultAddress?: Address;
  numberOfOrders: number;
}

export interface Address {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  formatted: string[];
  isDefault: boolean;
}

export interface AddressInput {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  territoryCode?: string;
  zip?: string;
  phoneNumber?: string;
}

export type FulfillmentStatus =
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "RESTOCKED"
  | "PENDING_FULFILLMENT"
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "SCHEDULED";

export type FinancialStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "VOIDED"
  | "EXPIRED"
  | "DECLINED";

export interface Order {
  id: string;
  name: string; // Order number like "#1001"
  orderNumber: number;
  processedAt: string;
  fulfillmentStatus: FulfillmentStatus;
  financialStatus: FinancialStatus;
  cancelledAt?: string;
  cancelReason?: string;
  totalPrice: Money;
  subtotalPrice?: Money;
  totalShippingPrice?: Money;
  totalTax?: Money;
  totalDiscounts?: Money; // Not available in Customer Account API
  currencyCode: string;
  lineItems: OrderLineItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  fulfillments: Fulfillment[];
  statusPageUrl: string;
}

export interface OrderLineItem {
  id: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  originalTotalPrice: Money;
  discountedTotalPrice: Money;
  image?: OrderLineItemImage;
  productId?: string;
  variantId?: string;
  sku?: string;
}

export interface OrderLineItemImage {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface Fulfillment {
  trackingCompany?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveredAt?: string;
  estimatedDeliveryAt?: string;
  inTransitAt?: string;
  status: FulfillmentStatus;
  fulfillmentLineItems: FulfillmentLineItem[];
}

export interface FulfillmentLineItem {
  lineItemId: string;
  quantity: number;
}

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface GetOrdersOptions {
  first?: number;
  after?: string;
  sortKey?: OrderSortKey;
  reverse?: boolean;
}

export type OrderSortKey = "PROCESSED_AT" | "TOTAL_PRICE" | "ID";

export interface CustomerUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CustomerApiError {
  field?: string[];
  message: string;
  code?: string;
}

export interface CustomerMutationResult<T> {
  data?: T;
  errors?: CustomerApiError[];
}

