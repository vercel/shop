export const siteName = "Vercel Shop";

export const homeTitle = "Production-ready storefront on Next.js";

export const homeSubtitle = "Customize everything with AI agents";

export const homeDescription = `${homeTitle} ${homeSubtitle}`;

export const docsTitle = "Vercel Shop Documentation";

export const docsDescription =
  "Documentation for Vercel Shop — an agent-native, fast-by-default Shopify storefront built on Next.js.";

export function getBaseUrl() {
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  if (previewHost) {
    return new URL(`https://${previewHost}`);
  }

  return new URL(`http://localhost:${process.env.PORT ?? "3000"}`);
}
