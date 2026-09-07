import type {
  AnyCustomerAccountDocument,
  CustomerAccountDocument,
} from "@shopify/hydrogen/customer-account";

// Hydrogen auto-injects `$language`; the app owns `country` in the request context.
export type CustomerAccountVariables<Doc extends AnyCustomerAccountDocument> = Omit<
  Doc extends CustomerAccountDocument<unknown, infer Variables, string> ? Variables : never,
  "language"
>;

export type CustomerAccountFetchOptions<Doc extends AnyCustomerAccountDocument> = {
  accessToken: string;
  document: Doc;
  operation: string;
} & (Record<string, never> extends CustomerAccountVariables<Doc>
  ? { variables?: CustomerAccountVariables<Doc> }
  : { variables: CustomerAccountVariables<Doc> });
