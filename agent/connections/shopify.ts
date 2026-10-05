import { defineMcpClientConnection } from "eve/connections";

import { agentProfileUrl } from "../lib/profile";

export default defineMcpClientConnection({
  description:
    "Search this store's Shopify catalog and look up products. Use present-products to render selected product IDs and get-product-details for the storefront variant picker.",
  toolCall: {
    providedArguments: { meta: () => ({ "ucp-agent": { profile: agentProfileUrl() } }) },
  },
  tools: { allow: ["search_catalog", "lookup_catalog", "get_product"] },
  url: `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/ucp/mcp`,
});
