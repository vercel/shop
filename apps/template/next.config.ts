import { withBotId } from "botid/next/config";
import { withEve } from "eve/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { shopConfig } from "./lib/config";
import { withShopConfig } from "./lib/config/server";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
  partialPrefetching: true,
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
      // proxy.ts prepends hidden /:flags/:locale segments before beforeFiles runs,
      // so these sources match the prefixed path and forward the locale as the
      // query the /md handlers already read.
      beforeFiles: [
        {
          source: "/:flags/:locale/collections/:handle",
          destination: "/md/collections/:handle?locale=:locale",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/:flags/:locale/products/:handle",
          destination: "/md/products/:handle?locale=:locale",
          has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
        },
        {
          source: "/:flags/:locale/search",
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

export default withShopConfig(nextConfig, [
  withNextIntl,
  shopConfig.botid.isEnabled && withBotId,
  shopConfig.agent.isEnabled && withEve,
]);
