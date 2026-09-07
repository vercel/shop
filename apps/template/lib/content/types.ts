import type { StaticImageData } from "next/image";

import type { SEO } from "@/lib/seo/types";

export interface MarketingImage {
  alt: string;
  height?: number;
  url: string;
  width?: number;
}

export interface MarketingVideo {
  previewImage?: MarketingImage | null;
  url: string;
}

export interface BannerSection {
  backgroundImage?: MarketingImage | StaticImageData | null;
  backgroundVideo?: MarketingVideo | null;
  ctaLink: string | null;
  ctaText: string | null;
  headline: string;
  id: string;
  subheadline?: string | null;
}

export interface ContentPage {
  body: string;
  handle: string;
  seo: SEO;
  title: string;
  updatedAt: string;
}

export interface ShopPolicy {
  body: string;
  handle: string;
  title: string;
}
