---
title: Derive NEXT_PUBLIC_AUTH_ENABLED at build time; expose isAuthEnabled from lib/auth
changeKey: auth-enabled-build-time-flag
introducedOn: 2026-04-26
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/.env.example
  - apps/template/AGENTS.md
  - apps/template/app/account/(authenticated)/layout.tsx
  - apps/template/app/account/login/layout.tsx
  - apps/template/components/layout/nav/index.tsx
  - apps/template/lib/auth/index.ts
  - apps/template/lib/auth/server.ts
  - apps/template/next.config.ts
---

## Summary

Two related changes to how the template detects whether auth is configured:

1. **Build-time derivation.** `NEXT_PUBLIC_AUTH_ENABLED` is no longer a manual env var. `next.config.ts` computes it from the presence of the three required server-only secrets (`BETTER_AUTH_SECRET`, `SHOPIFY_CUSTOMER_CLIENT_ID`, `SHOPIFY_CUSTOMER_CLIENT_SECRET`) and exposes it via the `env` config. Setting all three is the only knob — there's nothing to keep in sync.
2. **Universal `isAuthEnabled` export.** The flag now lives in `lib/auth/index.ts` instead of `lib/auth/server.ts`, so client components can import it without dragging in better-auth's server-only graph. `server.ts` keeps the better-auth config and session helpers.

## Why it matters

- Probing `BETTER_AUTH_SECRET` (or any non-`NEXT_PUBLIC_` env var) directly inside a component caused hydration mismatches under `cacheComponents: true` — the server saw the secret, the client didn't, and rendered branches diverged. Pinning the flag at build time makes server and client agree by construction.
- Removing the manual `NEXT_PUBLIC_AUTH_ENABLED` toggle eliminates a footgun where the icon could render but the OAuth flow was unconfigured (or vice versa).
- Moving the flag to `index.ts` follows the established `lib/<domain>/{index,server,client,action}.ts` convention: universal values belong in `index.ts`, not behind a `server-only` import.

## Migration in this PR

- `lib/auth/index.ts` is new; it exports the single `isAuthEnabled` constant.
- `lib/auth/server.ts` no longer exports `isAuthEnabled` (top-of-file comment updated).
- `next.config.ts` adds an `env: { NEXT_PUBLIC_AUTH_ENABLED }` block computed from the three secrets.
- `.env.example` no longer lists `NEXT_PUBLIC_AUTH_ENABLED`.
- Importers updated:
  - `components/layout/nav/index.tsx`: `@/lib/auth/server` → `@/lib/auth`.
  - `app/account/(authenticated)/layout.tsx`: split — `isAuthEnabled` from `@/lib/auth`, `requireCustomerSession` still from `@/lib/auth/server`.
  - `app/account/login/layout.tsx`: `@/lib/auth/server` → `@/lib/auth`.

## Apply when

- The storefront still uses `lib/auth/{server,client}.ts` largely as shipped.
- The storefront wants the auth icon and login flow gated automatically by secret presence.

## Safe to skip when

- The storefront has rewired auth onto a different provider (e.g. Clerk, Auth0) and no longer ships the better-auth + Shopify OIDC pair.
- The storefront has its own build-time feature-flag plumbing and would prefer to fold this in there.

## Validation

1. `pnpm --filter template build` with the three secrets set — `NEXT_PUBLIC_AUTH_ENABLED` should be `"1"` in the output bundle and the account icon should render.
2. `pnpm --filter template build` with any of the three secrets missing — flag becomes `""`, account icon disappears, `/account/*` and `/account/login` return 404.
3. `git grep -nE "NEXT_PUBLIC_AUTH_ENABLED" apps/template` should only match `next.config.ts` (assignment) and `lib/auth/index.ts` (read). No manual toggles in `.env*`.
4. `git grep -nE "from \"@/lib/auth/server\"" apps/template` should not return a line that also imports `isAuthEnabled`.
