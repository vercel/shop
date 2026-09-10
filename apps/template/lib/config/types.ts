import type { ConsentConfig, I18nConfig } from "@shopify/hydrogen";
import type { initBotId } from "botid/client/core";
import type { NextConfig } from "next";

export type CommerceLocale = Pick<I18nConfig, "country" | "language">;

export interface NextConfigContext {
  defaultConfig: NextConfig;
}

export type NextConfigFactory = (
  phase: string,
  context: NextConfigContext,
) => NextConfig | Promise<NextConfig>;

export type NextConfigInput = NextConfig | NextConfigFactory;

export type NextConfigPlugin = (config: NextConfig) => NextConfigInput | Promise<NextConfigInput>;

export interface ShopConfig {
  agent: {
    isEnabled: boolean;
  };
  analytics: {
    shopify: {
      consentMode: NonNullable<ConsentConfig["mode"]>;
      isEnabled: boolean;
    };
    speedInsights: {
      isEnabled: boolean;
    };
    vercel: {
      isEnabled: boolean;
    };
  };
  auth: {
    isEnabled: boolean;
  };
  botid: {
    checkLevel: NonNullable<
      NonNullable<
        Parameters<typeof initBotId>[0]["protect"][number]["advancedOptions"]
      >["checkLevel"]
    >;
    isEnabled: boolean;
  };
  localization: CommerceLocale & {
    locale: string;
  };
  pdp: {
    bundles: {
      isEnabled: boolean;
    };
    buyWithShop: {
      isEnabled: boolean;
    };
    complementaryProducts: {
      isEnabled: boolean;
    };
    quantityPicker: {
      isEnabled: boolean;
    };
    relatedProducts: {
      isEnabled: boolean;
    };
  };
  site: {
    name: string;
    url: string;
  };
  webmcp: {
    isEnabled: boolean;
  };
}
