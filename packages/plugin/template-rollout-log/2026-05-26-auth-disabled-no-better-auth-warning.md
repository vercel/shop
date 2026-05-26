---
title: Don't construct betterAuth when auth is disabled
changeKey: auth-disabled-no-better-auth-warning
introducedOn: 2026-05-26
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/auth/server.ts
  - apps/template/app/api/auth/[...all]/route.ts
---

## Summary

`lib/auth/server.ts` no longer constructs a betterAuth instance when `isAuthEnabled` is `false`. Calling `betterAuth({...})` without a real `BETTER_AUTH_SECRET` logs a default-secret warning at module-load — and the module gets compiled at build time because the auth route imports it, so the warning fired during every build of a storefront that doesn't opt into auth.

The fix:

- `lib/auth/server.ts`: `export const auth = isAuthEnabled ? betterAuth({...}) : null`. The internal `getAuthSession` and `getAccessToken` helpers short-circuit when `auth` is `null`. `getCustomerSession` / `getSession` naturally return `null` from there.
- `app/api/auth/[...all]/route.ts`: the route handler returns a 404 when `auth` is `null` (the user-facing surface is already gated by `isAuthEnabled` elsewhere; this is a defensive backstop so the route never tries to call `toNextJsHandler(null)`).

## Why it matters

- A storefront that hasn't opted into auth now produces a clean build — no more "You are using the default secret" noise from better-auth.
- Removes a footgun where the warning could be read as "auth is misconfigured" when in fact auth is simply turned off.
- Aligns the runtime cost too: an auth-disabled deployment no longer pays for a betterAuth instance, an OIDC plugin, and a cookie session config it will never use.

## Apply when

- The storefront still uses the template's `lib/auth/*` modules and gates auth via `NEXT_PUBLIC_ENABLE_AUTH`.
- The storefront wants clean build output when auth is disabled.

## Safe to skip when

- The storefront has rewired auth onto a different provider (Clerk, Auth0, custom) and `lib/auth/server.ts` no longer matches the template.
- The storefront always runs with `NEXT_PUBLIC_ENABLE_AUTH=1`, so the unconfigured path never executes.

## Validation

1. Build with `NEXT_PUBLIC_ENABLE_AUTH` unset — the "default secret" warning should be gone from build output.
2. Build with `NEXT_PUBLIC_ENABLE_AUTH=1` and the three required secrets — sign-in flow, `/account/*` pages, and `/api/auth/*` callbacks behave as before.
3. With auth disabled, `curl http://localhost:3000/api/auth/anything` returns `404`.
