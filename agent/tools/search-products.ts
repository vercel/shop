import { defineTool } from "eve/tools";
import { z } from "zod";

import { shopConfig } from "../../lib/config";
import { toMinorUnits } from "../../lib/money";
import { fetchCatalogSearch } from "../../lib/shopify/operations/catalog/server";
import { fetchLocalizationCurrency } from "../../lib/shopify/operations/localization/server";
import { toCatalogCandidate } from "../lib/catalog";
import { agentProfileUrl } from "../lib/profile";

const RESULT_LIMIT = 12;

const searchStateSchema = z.object({
  available: z.literal(false).optional(),
  cursor: z.string(),
  maxPrice: z.number().optional(),
  query: z.string(),
});

type SearchState = z.infer<typeof searchStateSchema>;

// A catalog cursor is only valid for the inputs that produced it, so the cursor carries them.
function encodeCursor(state: SearchState) {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

function decodeCursor(token: string) {
  try {
    return searchStateSchema.parse(JSON.parse(Buffer.from(token, "base64url").toString()));
  } catch {
    return undefined;
  }
}

export default defineTool({
  description:
    "Search this store's catalog and return matching products to choose from. Render the chosen ones with present-products.",
  inputSchema: z.strictObject({
    cursor: z
      .string()
      .max(4000)
      .optional()
      .describe("The nextCursor from an earlier search-products result, to see more of it."),
    includeUnavailable: z
      .boolean()
      .optional()
      .describe("Search products that are not for sale right now, when sale-ready results miss."),
    maxPrice: z
      .number()
      .positive()
      .max(10_000_000)
      .optional()
      .describe(
        "The shopper's firm price cap in the store's currency, such as 80 for $80. Omit when they gave none.",
      ),
    query: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .describe("The shopper's request in their words, rewritten only for clarity."),
  }),
  execute: async (input) => {
    const saved = input.cursor ? decodeCursor(input.cursor) : undefined;
    if (input.cursor && !saved) return { error: "Search again without this cursor." };
    const query = saved?.query ?? input.query;
    const maxPrice = saved ? saved.maxPrice : input.maxPrice;
    const { country, locale } = shopConfig.localization;
    try {
      const currency = maxPrice === undefined ? undefined : await fetchLocalizationCurrency();
      const search = (available?: false) =>
        fetchCatalogSearch({
          context: { country, currency, language: locale },
          cursor: saved?.cursor,
          filters: {
            available,
            maxPrice:
              currency && maxPrice !== undefined ? toMinorUnits(maxPrice, currency) : undefined,
          },
          limit: RESULT_LIMIT,
          profile: agentProfileUrl(),
          query,
        });
      let available = saved
        ? saved.available
        : input.includeUnavailable
          ? (false as const)
          : undefined;
      let result = await search(available);
      // Catalog search returns only sale-ready products, so a miss may still exist out of stock.
      if (!saved && available === undefined && !result.products.length) {
        available = false;
        result = await search(available);
      }
      return {
        messages: result.messages,
        nextCursor: result.cursor
          ? encodeCursor({ available, cursor: result.cursor, maxPrice, query })
          : null,
        products: result.products.map(toCatalogCandidate),
        ...(available === false ? { includedUnavailable: true } : {}),
      };
    } catch {
      return { error: "Catalog search is unavailable." };
    }
  },
});
