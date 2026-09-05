import { createRequire } from "node:module";

import { ApiType, pluckConfig, preset } from "@shopify/api-codegen-preset";

const require = createRequire(import.meta.url);
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "unstable";
const customerDocuments = [
  "lib/shopify/customer-account*.ts",
  "lib/shopify/operations/customer.ts",
];
const storefrontDocuments = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "hooks/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  ...customerDocuments.map((path) => `!${path}`),
  "!lib/shopify/types/generated/**",
];

function project(apiType: ApiType, schema: string, documents: string[], name: string) {
  return {
    documents,
    extensions: {
      codegen: {
        generates: {
          [`./lib/shopify/types/generated/${name}.generated.d.ts`]: {
            preset,
            presetConfig: { apiType },
          },
        },
        pluckConfig,
      },
    },
    schema,
  };
}

export default {
  projects: {
    customer: project(
      ApiType.Customer,
      require.resolve("@shopify/hydrogen/customer-account.schema.json"),
      customerDocuments,
      "customer",
    ),
    storefront: project(
      ApiType.Storefront,
      `https://shopify.dev/storefront-graphql-direct-proxy/${apiVersion}`,
      storefrontDocuments,
      "storefront",
    ),
  },
};
