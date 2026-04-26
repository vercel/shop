---
title: Lib convention — name files by execution context (index/server/client/action)
changeKey: lib-execution-context-convention
introducedOn: 2026-04-25
changeType: refactor
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
  - apps/template/lib/agent/server.ts
  - apps/template/lib/agent/index.ts
  - apps/template/lib/agent/tools/*.ts
  - apps/template/lib/auth/server.ts
  - apps/template/lib/shopify/fetch.ts
  - apps/template/lib/shopify/operations/*.ts
  - apps/template/app/api/chat/route.ts
  - apps/template/app/api/auth/[...all]/route.ts
  - apps/template/app/account/(authenticated)/layout.tsx
  - apps/template/app/account/login/layout.tsx
  - apps/template/components/agent/registry.tsx
  - apps/template/components/layout/nav/index.tsx
---

## Summary

Codifies a single naming convention for files inside `lib/<domain>/`:

- `index.ts` — universal modules (safe to import from server *and* client code)
- `server.ts` — server-only modules
- `client.ts` — `"use client"` modules
- `action.ts` — `"use server"` server actions

Two exceptions called out in AGENTS.md:

- Folders that group multiple modules of the *same* execution context (e.g. `lib/markdown/` — one generator per route, `lib/agent/tools/` — one tool per file). Keep descriptive filenames per module; the convention's purpose-by-filename collapses when there are several purpose-equal modules in one folder.
- Flat single-file modules at `lib/` root (`lib/types.ts`, `lib/config.ts`, `lib/seo.ts`, etc.). They aren't in a domain folder, so the convention doesn't apply.

Also adds a guardrail: avoid the word "client" in a filename to mean an HTTP/SDK client wrapper, since it collides with the runtime meaning. Use a verb (`fetch.ts`) or product noun (`shopify.ts`) instead.

## Concrete migrations in this PR

| Before | After | Notes |
|---|---|---|
| `lib/agent/create-agent.ts` + `context.ts` + `prompt.ts` | `lib/agent/server.ts` (one file) | All three were server-only and tightly coupled — merged into a single server module with `── Section ──` headers. |
| `lib/agent/ui/catalog.ts` (and `ui/` dir) | `lib/agent/index.ts` | Universal: imported by both `server.ts` (system prompt builder) and `components/agent/registry.tsx` (`"use client"`). `ui/` directory removed. |
| `lib/auth/auth.ts` | merged into `lib/auth/server.ts` | All server-only better-auth config; one file is enough. |
| `lib/shopify/client.ts` | `lib/shopify/fetch.ts` | The "client" name collided with the convention's runtime meaning. Renamed to `fetch.ts` (descriptive of `shopifyFetch`). |
| `lib/agent/tools/*.ts` (10 files) | unchanged contents, import path updated | `from "../context"` → `from "../server"` |

## Importer updates

- `app/api/chat/route.ts`: agent imports now come from `@/lib/agent/server` (one source) instead of `/create-agent` + `/context`.
- `app/api/auth/[...all]/route.ts`, `app/account/(authenticated)/layout.tsx`, `app/account/login/layout.tsx`, `components/layout/nav/index.tsx`: `@/lib/auth/auth` → `@/lib/auth/server`.
- `components/agent/registry.tsx`: `@/lib/agent/ui/catalog` → `@/lib/agent`.
- `lib/shopify/operations/*.ts` (6 files): `from "../client"` → `from "../fetch"`.

No public API or behavior changes. Every export keeps its name.

## Why it matters

- An agent reading a new `lib/<domain>/` folder can predict file purpose from filename.
- Resolves the historical contradiction where `lib/shopify/client.ts` meant "HTTP client" while `lib/auth/client.ts` meant "client-only-runtime".
- Reduces `lib/agent/` from five files in three directories to two files plus a tools sub-folder.

## Apply when

- The storefront still uses these files largely as shipped.
- The storefront wants to align future `lib/<domain>/` folders with the same convention.

## Safe to skip when

- The storefront has heavily restructured `lib/` along different lines (e.g. one mega `lib/api/` flat folder).
- The storefront imports any of the moved/removed paths from custom code not in this template.

## Validation

1. `pnpm --filter template build` — clean (the pre-existing i18n typecheck errors on main are unrelated).
2. `git grep -E "@/lib/agent/(create-agent|context|prompt|ui/)|@/lib/auth/auth|@/lib/shopify/client" apps/template` returns no results.
3. POST to `/api/chat` — the agent still streams (verifies `lib/agent/server.ts` merge).
4. Visit any page with auth enabled (`NEXT_PUBLIC_AUTH_ENABLED=1`) — login redirect, account pages, sign-in/out all still work (verifies `lib/auth/server.ts` merge).
5. Browse a collection and a product page — Shopify fetches succeed (verifies `lib/shopify/fetch.ts` rename).
