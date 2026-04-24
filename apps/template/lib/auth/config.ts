/** True when all required auth env vars were set at build time.
 * Reads NEXT_PUBLIC_AUTH_CONFIGURED, which is inlined by next.config.ts,
 * so the value is identical on server and client — no hydration mismatch. */
export const isAuthConfigured = process.env.NEXT_PUBLIC_AUTH_CONFIGURED === "1";
