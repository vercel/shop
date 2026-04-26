// Universal auth flag: safe to import from server and client code.
// `NEXT_PUBLIC_AUTH_ENABLED` is computed at build time in next.config.ts based on
// whether the three required secrets are set. Don't set it manually.
export const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";
