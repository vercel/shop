import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

import { shopConfig } from "./shop.config";

function assertRequiredEnv() {
  const missingShopify = ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_STOREFRONT_ACCESS_TOKEN"].filter(
    (key) => !process.env[key],
  );

  if (missingShopify.length > 0) {
    throw new Error(
      `Missing required Shopify environment variables: ${missingShopify.join(", ")}. See .env.example.`,
    );
  }

  if (shopConfig.auth.enabled) {
    const missing = [
      "CUSTOMER_ACCOUNT_SESSION_SECRET",
      "SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID",
    ].filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Enabled auth requires: ${missing.join(", ")}. ` +
          `Set the missing variables or disable auth in shop.config.ts or NEXT_PUBLIC_ENABLE_AUTH.`,
      );
    }
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    deviceSizes: [1080, 1920],
    imageSizes: [],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        hostname: "cdn.shopify.com",
        protocol: "https",
      },
    ],
    unoptimized: !!process.env.V0_CALLBACK_URL,
  },
  reactCompiler: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/collections/:handle",
          destination: "/md/collections/:handle",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/products/:handle",
          destination: "/md/products/:handle",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/search",
          destination: "/md/search",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

const withNextIntl = createNextIntlPlugin({
  experimental: { createMessagesDeclaration: "./lib/i18n/messages/en.json" },
  requestConfig: "./lib/i18n/request.ts",
});

const config = withNextIntl(nextConfig);

function getConfig(phase: string): NextConfig {
  // `next typegen` shares PHASE_PRODUCTION_BUILD but runs before any .env exists (create-next-app), so exclude it.
  const isTypegen = process.argv.includes("typegen");
  const isRuntime =
    phase === PHASE_DEVELOPMENT_SERVER ||
    phase === PHASE_PRODUCTION_BUILD ||
    phase === PHASE_PRODUCTION_SERVER;

  if (isRuntime && !isTypegen) {
    assertRequiredEnv();
  }

  return config;
}

export default getConfig;
