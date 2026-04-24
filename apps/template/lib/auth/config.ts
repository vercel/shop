/** True when auth is enabled via the NEXT_PUBLIC_AUTH_ENABLED env var.
 * Uses a NEXT_PUBLIC_ var so the value is inlined at build time and
 * identical on server and client — no hydration mismatch. */
export const isAuthConfigured = process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";
