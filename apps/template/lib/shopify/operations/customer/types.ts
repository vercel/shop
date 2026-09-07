import type { AnyCustomerAccountDocument } from "@shopify/hydrogen/customer-account";

import type { CustomerAccountFetchOptions } from "@/lib/shopify/customer-account/types";

export interface CustomerUserError {
  code?: string;
  field?: string[] | null;
  message: string;
}
export type CustomerFetchOptions<Doc extends AnyCustomerAccountDocument> = Omit<
  CustomerAccountFetchOptions<Doc>,
  "accessToken"
> & { returnTo: string };
