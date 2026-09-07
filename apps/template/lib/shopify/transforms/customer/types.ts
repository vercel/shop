import type { CUSTOMER_PROFILE_FRAGMENT } from "@/lib/shopify/fragments/customer";
import type { ADDRESS_FRAGMENT } from "@/lib/shopify/fragments/customer-address";
import type {
  ORDER_FRAGMENT,
  ORDER_SUMMARY_FRAGMENT,
} from "@/lib/shopify/fragments/customer-order";
import type { CustomerAccountResultOf } from "@/lib/shopify/types";

export type ShopifyCustomerAddress = CustomerAccountResultOf<typeof ADDRESS_FRAGMENT>;
export type ShopifyOrderSummary = CustomerAccountResultOf<typeof ORDER_SUMMARY_FRAGMENT>;
export type ShopifyOrder = CustomerAccountResultOf<typeof ORDER_FRAGMENT>;
export type ShopifyCustomerProfile = CustomerAccountResultOf<typeof CUSTOMER_PROFILE_FRAGMENT>;
export type ShopifyLineItem = ShopifyOrder["lineItems"]["nodes"][number];
export type ShopifyMoney = ShopifyOrderSummary["totalPrice"];
