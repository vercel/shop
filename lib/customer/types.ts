import type { CustomerAddressInput as ShopifyCustomerAddressInput } from "@shopify/hydrogen/customer-account-api-types";

import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";
import type { PageInfo } from "@/lib/pagination/types";

export interface AccountActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
  success: boolean;
}

export interface CustomerProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface OrderLineItem {
  image: Image | null;
  quantity: number;
  title: string;
  totalPrice: Money | null;
  variantTitle: string | null;
}

export interface CustomerOrderSummary {
  financialStatus: string | null;
  fulfillmentStatus: string;
  id: string;
  name: string;
  number: number;
  processedAt: string;
  totalPrice: Money;
}

export interface CustomerOrder extends CustomerOrderSummary {
  lineItems: OrderLineItem[];
  shippingAddress: CustomerAddress | null;
  statusPageUrl: string;
  subtotal: Money | null;
  totalShipping: Money | null;
  totalTax: Money | null;
}

export interface CustomerOrdersPage {
  orders: CustomerOrderSummary[];
  pageInfo: PageInfo;
}

export interface CustomerAddress {
  address1: string | null;
  address2: string | null;
  city: string | null;
  company: string | null;
  countryCode: string | null;
  firstName: string | null;
  formatted: string[];
  id: string;
  isDefault: boolean;
  lastName: string | null;
  phoneNumber: string | null;
  zip: string | null;
  zoneCode: string | null;
}

// Form values keyed by Shopify's input, so renamed or removed fields fail typecheck.
export type CustomerAddressInput = Partial<Record<keyof ShopifyCustomerAddressInput, string>>;
