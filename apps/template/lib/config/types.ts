import type { ConsentConfig, I18nConfig } from "@shopify/hydrogen";
import type { initBotId } from "botid/client/core";
import type { NextConfig } from "next";

import type { MenuItem } from "@/lib/shopify/transforms/menu/types";

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
  browserAgents: {
    webmcp: {
      isEnabled: boolean;
    };
  };
  localization: CommerceLocale & {
    locale: string;
  };
  navigation: {
    footer: MenuItem[];
    nav: MenuItem[];
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
  search: {
    isEnabled: boolean;
  };
  site: {
    name: string;
    socialLinks: SocialLink[];
    url: string;
  };
}

export type SocialPlatform =
  | "facebook"
  | "github"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "tiktok"
  | "x"
  | "youtube";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}
