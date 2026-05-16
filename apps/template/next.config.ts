import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Auth turns on at build time when all three secrets are present. Exposed to the
// browser as NEXT_PUBLIC_AUTH_ENABLED so client and server agree at hydration.
const isAuthEnabled = !!(
  process.env.BETTER_AUTH_SECRET &&
  process.env.SHOPIFY_CUSTOMER_CLIENT_ID &&
  process.env.SHOPIFY_CUSTOMER_CLIENT_SECRET
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  env: {
    NEXT_PUBLIC_AUTH_ENABLED: isAuthEnabled ? "1" : "",
  },
  experimental: {
    cachedNavigations: true,
    inlineCss: true,
    optimisticRouting: true,
    rootParams: true,
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 384],
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

export default withNextIntl(nextConfig);
