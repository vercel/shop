import type { MenuItem } from "@/lib/shopify/types/menu";
import { shopConfig } from "@/shop.config";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

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

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Vercel Shop",
  socialLinks: [] as SocialLink[],
  url: trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || defaultUrl),
} as const;

export const agent = {
  ...shopConfig.agent,
  enabled: process.env.NEXT_PUBLIC_ENABLE_AGENT
    ? process.env.NEXT_PUBLIC_ENABLE_AGENT === "1"
    : shopConfig.agent.enabledByDefault,
} as const;

export const analytics = shopConfig.analytics;

export const auth = {
  ...shopConfig.auth,
  enabled: process.env.NEXT_PUBLIC_ENABLE_AUTH
    ? process.env.NEXT_PUBLIC_ENABLE_AUTH === "1"
    : shopConfig.auth.enabledByDefault,
} as const;

export const pdp = shopConfig.pdp;

export const navItems: MenuItem[] = [
  {
    id: "default-nav-shop",
    title: "Shop",
    url: "/collections/all",
    type: "HTTP",
    items: [],
  },
  {
    id: "default-nav-about",
    title: "About",
    url: "/about",
    type: "HTTP",
    items: [],
  },
];

export const footerItems: MenuItem[] = [];
