export const siteName = "Vercel Shop";

export const homeTitle = "Ship a production-ready Shopify storefront in days.";

export const homeSubtitle = "Customize everything with AI agents. Built on Next.js.";

export const homeDescription = `${homeTitle} ${homeSubtitle}`;

export const docsTitle = "Vercel Shop Documentation";

export const docsDescription =
  "Documentation for Vercel Shop — an agent-native, fast-by-default Shopify storefront built on Next.js.";

export function getBaseUrl() {
  const host =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  return new URL(`${protocol}://${host}`);
}
