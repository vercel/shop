import { withBotId } from "botid/next/config";
import { withEve } from "eve/next";
import type { NextConfig } from "next";

import { shopConfig } from "./lib/config";
import { assertRequiredEnv } from "./lib/config/server";

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
};

export default async function createNextConfig(
  phase: string,
  context: { defaultConfig: NextConfig },
) {
  assertRequiredEnv(phase);
  const config = shopConfig.botid.isEnabled ? withBotId(nextConfig) : nextConfig;
  return shopConfig.agent.isEnabled ? withEve(config)(phase, context) : config;
}
