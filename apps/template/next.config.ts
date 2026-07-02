import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

function assertRequiredEnv() {
  const missingShopify = ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_STOREFRONT_ACCESS_TOKEN"].filter(
    (key) => !process.env[key],
  );

  if (missingShopify.length > 0) {
    throw new Error(
      `Missing required Shopify environment variables: ${missingShopify.join(", ")}. See .env.example.`,
    );
  }

  if (process.env.NEXT_PUBLIC_ENABLE_AUTH === "1") {
    const missing = [
      "BETTER_AUTH_SECRET",
      "SHOPIFY_CUSTOMER_CLIENT_ID",
      "SHOPIFY_CUSTOMER_CLIENT_SECRET",
    ].filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `NEXT_PUBLIC_ENABLE_AUTH=1 requires: ${missing.join(", ")}. ` +
          `Set the missing variables or unset NEXT_PUBLIC_ENABLE_AUTH.`,
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
  serverExternalPackages: ["better-auth"],
};

const withNextIntl = createNextIntlPlugin({
  experimental: { createMessagesDeclaration: "./lib/i18n/messages/en.json" },
  requestConfig: "./lib/i18n/request.ts",
});

const config = withNextIntl(nextConfig);

export default function getConfig(phase: string): NextConfig {
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
