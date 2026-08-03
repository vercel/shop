import type { ToneId } from "./tones";

export interface LayerLink {
  href: string;
  label: string;
}

export interface LayerTile {
  href: string;
  label: string;
  title: string;
  tone: ToneId;
}

export type HomeLayer =
  | {
      id: string;
      kind: "category-band";
      links: LayerLink[];
      subheadline: string;
      tile: LayerTile;
      title: string;
      tone: ToneId;
    }
  | {
      ctaHref: string;
      ctaLabel: string;
      id: string;
      kind: "editorial-split";
      mediaSide: "left" | "right";
      mediaSlotLabel: string;
      mediaTone: ToneId;
      subheadline: string;
      title: string;
      tone: ToneId;
    }
  | {
      collection: string;
      eyebrow: string;
      id: string;
      kind: "collection-rail";
      limit: number;
      tone: ToneId;
    }
  | {
      eyebrow: string;
      id: string;
      kind: "mosaic";
      tiles: LayerTile[];
      title: string;
      tone: ToneId;
      viewAllLabel: string;
    }
  | {
      ctaHref: string;
      ctaLabel: string;
      id: string;
      kind: "banner";
      mediaSlotLabel: string;
      subheadline: string;
      title: string;
      tone: ToneId;
    }
  | {
      id: string;
      kind: "value-props";
      items: {
        description: string;
        icon: "returns" | "shield" | "sparkle" | "truck";
        title: string;
      }[];
      tone: ToneId;
    }
  | {
      buttonLabel: string;
      description: string;
      eyebrow: string;
      finePrint: string;
      id: string;
      kind: "newsletter";
      placeholder: string;
      tone: ToneId;
      title: string;
    };

// Order is the cake: each tone tints the divider strip above the next layer.
export const HOME_LAYERS: HomeLayer[] = [
  {
    id: "shop-by-department",
    kind: "category-band",
    links: [
      { href: "/collections/mens", label: "Mens" },
      { href: "/collections/womens", label: "Womens" },
      { href: "/collections/youth", label: "Youth" },
      { href: "/collections/unisex", label: "Unisex" },
      { href: "/collections/jackets", label: "Jackets" },
      { href: "/collections/hoodies", label: "Hoodies" },
      { href: "/collections/tees", label: "Tees" },
      { href: "/collections/all", label: "Shop All" },
    ],
    subheadline: "Jump straight to what you're after.",
    tile: { href: "/collections/all", label: "Campaign image", title: "Shop All", tone: 3 },
    title: "Shop by Department",
    tone: 2,
  },
  {
    collection: "mens",
    eyebrow: "Layer 02",
    id: "rail-mens",
    kind: "collection-rail",
    limit: 6,
    tone: 2,
  },
  {
    ctaHref: "/collections/womens",
    ctaLabel: "Shop Womens",
    id: "editorial-womens",
    kind: "editorial-split",
    mediaSide: "left",
    mediaSlotLabel: "Editorial image",
    mediaTone: 12,
    subheadline:
      "Silhouettes that move from studio to street. Soft structures, sharp lines, and the season's most-wanted layers.",
    title: "The Womens Edit",
    tone: 8,
  },
  {
    collection: "womens",
    eyebrow: "Layer 04",
    id: "rail-womens",
    kind: "collection-rail",
    limit: 6,
    tone: 8,
  },
  {
    eyebrow: "Categories",
    id: "mosaic-categories",
    kind: "mosaic",
    tiles: [
      { href: "/collections/jackets", label: "Category image", title: "Jackets", tone: 6 },
      { href: "/collections/hoodies", label: "Category image", title: "Hoodies", tone: 10 },
      { href: "/collections/tees", label: "Category image", title: "Tees", tone: 3 },
      { href: "/collections/sweatshirts", label: "Category image", title: "Sweatshirts", tone: 4 },
      { href: "/collections/tanks", label: "Category image", title: "Tanks", tone: 7 },
      { href: "/collections/vests", label: "Category image", title: "Vests", tone: 5 },
    ],
    title: "Shop by Category",
    tone: 1,
    viewAllLabel: "All Collections",
  },
  {
    collection: "hoodies",
    eyebrow: "Layer 06",
    id: "rail-hoodies",
    kind: "collection-rail",
    limit: 6,
    tone: 10,
  },
  {
    ctaHref: "/collections/youth",
    ctaLabel: "Shop Youth",
    id: "editorial-youth",
    kind: "editorial-split",
    mediaSide: "right",
    mediaSlotLabel: "Editorial image",
    mediaTone: 5,
    subheadline:
      "Built for recess, weekends, and everything in between. Durable fabrics in colors they'll actually want to wear.",
    title: "Youth, Dialed In",
    tone: 4,
  },
  {
    collection: "youth",
    eyebrow: "Layer 08",
    id: "rail-youth",
    kind: "collection-rail",
    limit: 6,
    tone: 4,
  },
  {
    ctaHref: "/collections/clearance",
    ctaLabel: "Shop Clearance",
    id: "banner-clearance",
    kind: "banner",
    mediaSlotLabel: "Sale campaign image",
    subheadline: "Last-call styles at can't-miss prices. When they're gone, they're gone.",
    title: "Up to 50% Off Clearance",
    tone: 9,
  },
  {
    collection: "unisex",
    eyebrow: "Layer 10",
    id: "rail-unisex",
    kind: "collection-rail",
    limit: 6,
    tone: 13,
  },
  {
    id: "value-props",
    kind: "value-props",
    items: [
      {
        description: "Free standard shipping on every order over $100.",
        icon: "truck",
        title: "Free Shipping",
      },
      {
        description: "30-day returns, no questions asked. Exchanges are always free.",
        icon: "returns",
        title: "Easy Returns",
      },
      {
        description: "Every checkout is encrypted and PCI-compliant end to end.",
        icon: "shield",
        title: "Secure Checkout",
      },
      {
        description: "Premium fabrics, fair factories, and fits that hold up wash after wash.",
        icon: "sparkle",
        title: "Quality First",
      },
    ],
    tone: 14,
  },
  {
    buttonLabel: "Sign Up",
    description:
      "Sign up for first access to new drops, members-only offers, and stories from the studio.",
    eyebrow: "Stay in the Loop",
    finePrint: "No spam, ever. Unsubscribe anytime.",
    id: "newsletter",
    kind: "newsletter",
    placeholder: "Email address",
    tone: 11,
    title: "Join the List",
  },
];
