export const siteName = "Vercel Shop";

export const homeTitle = "Production-ready Shopify storefront on Next.js";

export const homeSubtitle = "Customize everything with AI agents";

export const homeDescription = `${homeTitle} ${homeSubtitle}`;

export const docsTitle = "Vercel Shop Documentation";

export const docsDescription =
  "Documentation for Vercel Shop — an agent-native, fast-by-default Shopify storefront built on Next.js.";

export function getBaseUrl() {
  if (
    process.env.VERCEL_ENV !== "production" &&
    process.env.NEXT_PUBLIC_VERCEL_URL
  ) {
    return new URL(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
  }

  const host =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  return new URL(`${protocol}://${host}`);
}
