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
  firstName: string | null;
  formatted: string[];
  id: string;
  isDefault: boolean;
  lastName: string | null;
  phoneNumber: string | null;
  territoryCode: string | null;
  zip: string | null;
  zoneCode: string | null;
}

export interface CustomerAddressInput {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  territoryCode?: string;
  zip?: string;
  zoneCode?: string;
}
