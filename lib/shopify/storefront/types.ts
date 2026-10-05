import type { AnyStorefrontQueryString, StorefrontApi } from "@shopify/hydrogen";

import type { CommerceLocale } from "@/lib/config/types";

// Hydrogen injects `$country`/`$language` from the client's i18n, so callers pass a locale instead.
export type StorefrontVariables<Doc extends AnyStorefrontQueryString> = Omit<
  StorefrontApi.VariablesOf<Doc>,
  "country" | "language"
>;

export type StorefrontRequestOptions<Doc extends AnyStorefrontQueryString> = {
  locale?: CommerceLocale;
} & (Record<string, never> extends StorefrontVariables<Doc>
  ? { variables?: StorefrontVariables<Doc> }
  : { variables: StorefrontVariables<Doc> });
