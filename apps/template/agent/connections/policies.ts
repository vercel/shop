import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  description:
    "Answer questions about this store's shipping, returns, payments, warranty, sizing, care, policies and FAQs. Do not invent answers when this source is unavailable.",
  tools: { allow: ["search_shop_policies_and_faqs"] },
  url: `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/mcp`,
});
