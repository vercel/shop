// Static labels for client error boundaries (error.tsx files), which must be
// client components per Next.js and so cannot await server-side tNamespace().
// Single-locale fallback: when a storefront enables multi-locale via
// /vercel-shop:enable-shopify-markets, next-intl's client hooks are restored
// and these constants can be replaced.
//
// Keep these strings in sync with `messages/en.json` -> `common.*`.

export const ERROR_BOUNDARY_LABELS = {
  errorLabel: "Something went wrong",
  errorDescLabel: "An unexpected error occurred. Please try again.",
  goHomeLabel: "Go back to the home page",
  tryAgainLabel: "Try again",
} as const;
