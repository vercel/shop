---
title: Add storefront building standards to agent guidance
changeKey: build-storefront-skill
introducedOn: 2026-06-26
changeType: meta
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
relatedSkills:
  - /vercel-shop:build-storefront
---

## Summary

Add a short, always-on storefront contract to the template's agent guidance. It defines ownership across routes, Shopify operations, Server Components, client islands, and server actions, then protects the route's dependency graph, cache boundaries, shell, loading states, media, and prefetch behavior.

The detailed route-specific workflow lives in the `build-storefront` plugin skill so coding agents can implement, redesign, extend, and review storefronts without prescribing their visual composition.

Performance remains a verification outcome of the broader storefront architecture and commerce workflow.

## Why it matters

Without explicit architecture, an implementation can look correct while accidentally serializing independent Shopify reads, moving public data to client effects, sharing personalized data, hiding primary content behind a broad boundary, or expanding the hydration and prefetch surface.

## Apply when

- Adopt for any storefront that uses coding agents to create, redesign, extend, or review route presentation and behavior.
- Adopt when the storefront retains the template's Cache Components and partial-prefetching architecture.

## Safe to skip when

- Skip only when the downstream project has equivalent route layering, data ownership, cache, streaming, client-boundary, and mutation rules in its own agent guidance.

## Validation

1. Confirm the downstream `AGENTS.md` describes route orchestration, data ownership, blocking dependencies, Suspense, client islands, mutation invalidation, images, and prefetch expectations.
2. If the Vercel Shop plugin is installed, invoke `/vercel-shop:build-storefront` and confirm it routes to the relevant page reference.
