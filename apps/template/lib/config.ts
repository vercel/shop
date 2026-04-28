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

function leaf(id: string, title: string, url = "#"): MenuItem {
  return { id, title, url, type: "HTTP", items: [] };
}

function group(id: string, title: string, url: string, items: MenuItem[]): MenuItem {
  return { id, title, url, type: "HTTP", items };
}

export const navItems: MenuItem[] = [
  group("nav-outdoor", "Outdoor", "#", [
    group("nav-outdoor-furniture", "Furniture", "#", [
      leaf("nav-outdoor-furniture-lounge", "Lounge Chairs"),
      leaf("nav-outdoor-furniture-sofas", "Sofas & Sectionals"),
      leaf("nav-outdoor-furniture-dining", "Dining"),
      leaf("nav-outdoor-furniture-side", "Side Tables"),
    ]),
    group("nav-outdoor-lighting", "Lighting", "#", [
      leaf("nav-outdoor-lighting-string", "String Lights"),
      leaf("nav-outdoor-lighting-lanterns", "Lanterns"),
      leaf("nav-outdoor-lighting-sconces", "Sconces"),
    ]),
    group("nav-outdoor-shade", "Shade", "#", [
      leaf("nav-outdoor-shade-umbrellas", "Umbrellas"),
      leaf("nav-outdoor-shade-pergolas", "Pergolas"),
      leaf("nav-outdoor-shade-awnings", "Awnings"),
    ]),
    group("nav-outdoor-cooking", "Cooking", "#", [
      leaf("nav-outdoor-cooking-grills", "Grills"),
      leaf("nav-outdoor-cooking-pizza", "Pizza Ovens"),
      leaf("nav-outdoor-cooking-smokers", "Smokers"),
    ]),
    group("nav-outdoor-new", "New Arrivals", "#", [
      leaf("nav-outdoor-new-spring", "Spring Collection"),
      leaf("nav-outdoor-new-bestsellers", "Bestsellers"),
    ]),
  ]),
  group("nav-interiors", "Interiors", "#", [
    group("nav-interiors-rugs", "Rugs", "#", [
      leaf("nav-interiors-rugs-area", "Area Rugs"),
      leaf("nav-interiors-rugs-runners", "Runners"),
      leaf("nav-interiors-rugs-vintage", "Vintage"),
    ]),
    group("nav-interiors-lighting", "Lighting", "#", [
      leaf("nav-interiors-lighting-pendants", "Pendants"),
      leaf("nav-interiors-lighting-floor", "Floor Lamps"),
      leaf("nav-interiors-lighting-table", "Table Lamps"),
    ]),
    group("nav-interiors-art", "Wall Art", "#", [
      leaf("nav-interiors-art-prints", "Prints"),
      leaf("nav-interiors-art-mirrors", "Mirrors"),
      leaf("nav-interiors-art-tapestry", "Tapestries"),
    ]),
    group("nav-interiors-textiles", "Textiles", "#", [
      leaf("nav-interiors-textiles-throws", "Throws"),
      leaf("nav-interiors-textiles-pillows", "Pillows"),
      leaf("nav-interiors-textiles-curtains", "Curtains"),
    ]),
  ]),
  group("nav-tableware", "Tableware", "#", [
    group("nav-tableware-glass", "Glassware", "#", [
      leaf("nav-tableware-glass-wine", "Wine"),
      leaf("nav-tableware-glass-cocktail", "Cocktail"),
      leaf("nav-tableware-glass-water", "Water"),
    ]),
    group("nav-tableware-ceramics", "Ceramics", "#", [
      leaf("nav-tableware-ceramics-dinner", "Dinner Plates"),
      leaf("nav-tableware-ceramics-bowls", "Bowls"),
      leaf("nav-tableware-ceramics-serving", "Serving"),
    ]),
    group("nav-tableware-linens", "Linens", "#", [
      leaf("nav-tableware-linens-tablecloths", "Tablecloths"),
      leaf("nav-tableware-linens-napkins", "Napkins"),
      leaf("nav-tableware-linens-runners", "Table Runners"),
    ]),
    group("nav-tableware-flatware", "Flatware", "#", [
      leaf("nav-tableware-flatware-sets", "Sets"),
      leaf("nav-tableware-flatware-serving", "Serving Pieces"),
    ]),
  ]),
  leaf("nav-sale", "Sale"),
  leaf("nav-about", "About", "/about"),
];

export const footerItems: MenuItem[] = [
  group("footer-shop", "Shop", "#", [
    leaf("footer-shop-outdoor", "Outdoor"),
    leaf("footer-shop-interiors", "Interiors"),
    leaf("footer-shop-tableware", "Tableware"),
    leaf("footer-shop-new", "New Arrivals"),
    leaf("footer-shop-sale", "Sale"),
    leaf("footer-shop-gift", "Gift Cards"),
  ]),
  group("footer-care", "Customer Care", "#", [
    leaf("footer-care-contact", "Contact Us"),
    leaf("footer-care-shipping", "Shipping"),
    leaf("footer-care-returns", "Returns & Exchanges"),
    leaf("footer-care-faq", "FAQ"),
    leaf("footer-care-orders", "Order Status"),
  ]),
  group("footer-company", "Company", "#", [
    leaf("footer-company-about", "About"),
    leaf("footer-company-press", "Press"),
    leaf("footer-company-careers", "Careers"),
    leaf("footer-company-sustainability", "Sustainability"),
    leaf("footer-company-stores", "Stores"),
  ]),
  group("footer-connect", "Stay Connected", "#", [
    leaf("footer-connect-newsletter", "Newsletter"),
    leaf("footer-connect-instagram", "Instagram"),
    leaf("footer-connect-pinterest", "Pinterest"),
    leaf("footer-connect-tiktok", "TikTok"),
  ]),
  group("footer-legal", "Legal", "#", [
    leaf("footer-legal-privacy", "Privacy Policy"),
    leaf("footer-legal-terms", "Terms of Service"),
    leaf("footer-legal-accessibility", "Accessibility"),
    leaf("footer-legal-cookies", "Cookie Settings"),
  ]),
];
