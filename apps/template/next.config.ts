import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

import { shopConfig } from "./lib/config";

function assertRequiredEnv() {
  const missingShopify = [
    "NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN",
  ].filter((key) => !process.env[key]);

  if (missingShopify.length > 0) {
    throw new Error(
      `Missing required Shopify environment variables: ${missingShopify.join(", ")}. See .env.example.`,
    );
  }

  if (shopConfig.auth.isEnabled) {
    const missing = [
      "CUSTOMER_ACCOUNT_SESSION_SECRET",
      "SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID",
    ].filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Enabled auth requires: ${missing.join(", ")}. ` +
          `Set the missing variables or disable auth via auth.isEnabled in lib/config.ts.`,
      );
    }
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // TS7's native compiler doesn't expose the programmatic API Next uses for type checking; the CLI path does.
  experimental: { useTypeScriptCli: true },
  images: {
    deviceSizes: [1080],
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
  turbopack: {
    rules: {
      "*.css": {
        as: "*.css",
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
  async rewrites() {
    return {
      // proxy.ts prepends the hidden /:locale segment before beforeFiles runs,
      // so these sources match the prefixed path and forward the locale as the
      // query the /md handlers already read.
      beforeFiles: [
        {
          source: "/:locale/collections/:handle",
          destination: "/md/collections/:handle?locale=:locale",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/:locale/products/:handle",
          destination: "/md/products/:handle?locale=:locale",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/:locale/search",
          destination: "/md/search?locale=:locale",
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

const intlConfig = withNextIntl(nextConfig);

const config = shopConfig.botid.isEnabled ? withBotId(intlConfig) : intlConfig;

function getConfig(phase: string): NextConfig {
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
