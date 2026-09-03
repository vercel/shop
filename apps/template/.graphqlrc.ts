import { ApiType, shopifyApiProject } from "@shopify/api-codegen-preset";

const apiVersion = process.env.SHOPIFY_API_VERSION ?? "unstable";
// Customer Account documents are validated by Hydrogen's CAAPI introspection types, not this Storefront schema.
const documents = [
  "lib/shopify/**/*.ts",
  "!lib/shopify/customer-account*.ts",
  "!lib/shopify/operations/customer.ts",
  "!lib/shopify/types/generated/**",
];

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
