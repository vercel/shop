---
title: Auth built in by default
changeKey: default-auth
introducedOn: 2026-04-21
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - lib/auth/auth.ts
  - lib/auth/server.ts
  - lib/auth/client.ts
  - app/api/auth/[...all]/route.ts
  - app/login/layout.tsx
  - app/login/page.tsx
  - components/layout/nav/account.tsx
  - components/layout/nav/index.tsx
  - lib/agent/context.ts
  - app/api/chat/route.ts
  - next.config.ts
relatedSkills:
  - /vercel-shop:enable-shopify-auth
---

## Summary

Customer authentication via better-auth with Shopify Customer Account API OIDC is now built into the template by default. Previously this was only available by running the `enable-shopify-auth` skill. The template now includes:

- Core auth library (`lib/auth/`) with server and client helpers
- Auth API catch-all route (`/api/auth/[...all]`)
- Login page (`/login`) with auto-redirect to Shopify OIDC
- Account icon in the navbar between search and cart
- Authenticated user context in the chat route

The `enable-shopify-auth` skill still provides the full account pages (profile, orders, addresses) as an optional addition.

## Why it matters

Storefronts that want customer login no longer need to run a skill first. The auth plumbing and nav icon are ready out of the box.

## Apply when

All storefronts should review. If you already ran the `enable-shopify-auth` skill, the auth library files and nav component are already in place and this change can be skipped.

## Safe to skip when

- You already ran the `enable-shopify-auth` skill and have `lib/auth/` in your codebase.
- You explicitly do not want customer authentication.

## Validation

1. Verify `lib/auth/auth.ts`, `lib/auth/server.ts`, `lib/auth/client.ts` exist.
2. Verify `app/api/auth/[...all]/route.ts` exists.
3. Verify the navbar renders an account icon between search and cart.
4. Verify `pnpm build` succeeds.
