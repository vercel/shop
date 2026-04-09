function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "pinterest"
  | "linkedin"
  | "github";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Vercel Shop",
  url: trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL || defaultUrl),
  socialLinks: [] as SocialLink[],
} as const;
