import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

import { shopConfig } from "./index";
import type {
  NextConfigContext,
  NextConfigFactory,
  NextConfigInput,
  NextConfigPlugin,
} from "./types";

function assertRequiredEnv(phase: string) {
  if (![PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER].includes(phase))
    return;
  // Next typegen uses the production-build phase but does not need Shopify credentials.
  if (process.argv.includes("typegen")) return;

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
      "SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_SECRET",
    ].filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Enabled auth requires: ${missing.join(", ")}. ` +
          `Set the missing variables or disable auth via auth.isEnabled in lib/config/index.ts.`,
      );
    }
  }
}

async function resolveConfig(config: NextConfigInput, phase: string, context: NextConfigContext) {
  return typeof config === "function" ? config(phase, context) : config;
}

export function withShopConfig(
  nextConfig: NextConfigInput,
  plugins: readonly (NextConfigPlugin | false | null | undefined)[] = [],
): NextConfigFactory {
  return async (phase, context) => {
    assertRequiredEnv(phase);

    let config = await resolveConfig(nextConfig, phase, context);
    for (const plugin of plugins) {
      if (plugin) config = await resolveConfig(await plugin(config), phase, context);
    }
    return config;
  };
}
