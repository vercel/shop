import type { MenuItem } from "@/lib/shopify/types/menu";

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

export const auth = {
  enabled: process.env.NEXT_PUBLIC_ENABLE_AUTH === "1",
} as const;

export const agent = {
  enabled: process.env.NEXT_PUBLIC_ENABLE_AGENT === "1",
} as const;

// Product metafields to surface on the PDP, by namespace + key. Empty by default:
// namespaces are shop-specific, so a storefront opts in to the ones it populates.
// Friendly labels for each key live in METAFIELD_LABELS (lib/shopify/transforms/product.ts).
export const productMetafieldIdentifiers: Array<{ key: string; namespace: string }> = [
  // { namespace: "custom", key: "material" },
  // { namespace: "reviews", key: "rating" },
];

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
