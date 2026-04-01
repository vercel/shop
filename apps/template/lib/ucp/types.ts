/**
 * UCP Types — Universal Commerce Protocol
 *
 * These types follow the UCP specification (2026-01-11).
 * Amounts are in minor units (cents). Dates are RFC 3339.
 */

export interface UCPMetadata {
  version: string;
  capabilities: string[];
}

export type CheckoutStatus =
  | "incomplete"
  | "requires_escalation"
  | "ready_for_complete"
  | "complete_in_progress"
  | "completed"
  | "canceled";

export type MessageSeverity = "recoverable" | "requires_buyer_input" | "requires_buyer_review";

export interface CheckoutMessage {
  code: string;
  severity: MessageSeverity;
  message: string;
  field?: string;
}

export interface CheckoutLinks {
  self: string;
  continue_url?: string;
  privacy_policy?: string;
  terms_of_service?: string;
  refund_policy?: string;
  shipping_policy?: string;
}

export interface UCPLineItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  product_url?: string;
  image_url?: string;
}

export interface UCPTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  grand_total: number;
  currency: string;
}

export interface UCPPaymentInfo {
  status: "pending" | "authorized" | "captured" | "failed";
  handlers: Array<{ id: string; type: string }>;
  amount_due: number;
  currency: string;
}

export interface UCPCheckoutSession {
  ucp: UCPMetadata;
  id: string;
  status: CheckoutStatus;
  currency: string;
  line_items: UCPLineItem[];
  totals: UCPTotals;
  payment: UCPPaymentInfo;
  links: CheckoutLinks;
  messages: CheckoutMessage[];
  expires_at: string;
  created_at: string;
  updated_at: string;
  buyer?: {
    email?: string;
    phone?: string;
    name?: string;
  };
}

export interface UCPProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: { amount: number; currency: string };
  compare_at_price?: { amount: number; currency: string } | null;
  available: boolean;
  vendor?: string;
  url: string;
  image_url?: string | null;
  variants: Array<{
    id: string;
    title: string;
    available: boolean;
    price: { amount: number; currency: string };
    options: Array<{ name: string; value: string }>;
  }>;
}

export interface UCPCollection {
  handle: string;
  title: string;
  description: string;
  url: string;
}

export interface UCPDiscoveryProfile {
  ucp: {
    version: string;
    services: Record<
      string,
      {
        version: string;
        spec: string;
        rest?: { schema: string; endpoint: string };
        mcp?: { schema: string; endpoint: string };
      }
    >;
    capabilities: Array<{
      name: string;
      version: string;
      spec: string;
      schema: string;
      extends?: string;
    }>;
  };
}
