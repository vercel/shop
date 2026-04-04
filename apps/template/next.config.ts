import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // cacheComponents: true, // Disabled: causes ISR fallback pages to serve text/html for RSC requests, breaking client-side navigation
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
