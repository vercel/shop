import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        hostname: "cdn.shopify.com",
        protocol: "https",
      },
    ],
    unoptimized: !!process.env.V0_CALLBACK_URL,
  },
  rewrites: async () => [
    {
      source: "/products/:handle",
      destination: "/products/md/:handle",
      has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
    },
    {
      source: "/products/:handle",
      has: [{ type: "query", key: "variantId", value: "(?<variantId>.+)" }],
      destination: "/products/:handle/:variantId",
    },
  ],
};

const withNextIntl = createNextIntlPlugin({
  experimental: { createMessagesDeclaration: "./lib/i18n/messages/en.json" },
  requestConfig: "./lib/i18n/request.ts",
});

export default withNextIntl(nextConfig);
