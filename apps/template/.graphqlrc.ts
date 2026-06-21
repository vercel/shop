import { ApiType, shopifyApiProject } from "@shopify/api-codegen-preset";

const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2026-04";
const documents = ["lib/shopify/**/*.ts", "!lib/shopify/types/generated/**"];

export default {
  schema: `https://shopify.dev/storefront-graphql-direct-proxy/${apiVersion}`,
  documents,
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Storefront,
      apiVersion,
      documents,
      outputDir: "./lib/shopify/types/generated",
    }),
  },
};
