import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    cachedNavigations: true,
    inlineCss: true,
    optimisticRouting: true,
    partialFallbacks: true,
    turbopackFileSystemCacheForDev: true,
    varyParams: true,
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
  reactCompiler: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/collections/:handle",
          destination: "/collections/md/:handle",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/products/:handle",
          destination: "/products/md/:handle",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/search",
          destination: "/search/md",
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

export default withNextIntl(nextConfig);
