import type { SEO } from "@/lib/seo/types";

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
