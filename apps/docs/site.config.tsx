export const Logo = () => (
  <p
    className="font-semibold text-xl tracking-tight"
    style={{ fontFamily: "var(--font-geist-pixel-square), ui-monospace, monospace" }}
  >
    Shop
  </p>
);

export const github = {
  owner: "vercel",
  repo: "shop",
};

export const nav = [
  {
    label: "Docs",
    href: "/docs",
  },
  {
    label: "Demo",
    href: "https://vercel-shop.labs.vercel.dev",
    target: "_blank",
  },
  {
    label: "GitHub",
    href: "https://github.com/vercel/shop",
    target: "_blank",
  },
];

export const title = "Vercel Shop Documentation";

export const prompt =
  "You are a helpful assistant specializing in answering questions about Vercel Shop, the standard for Shopify development.";
