---
title: Add the storefront architecture contract to agent guidance
changeKey: storefront-architecture-contract
introducedOn: 2026-06-25
changeType: meta
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
relatedSkills:
  - /vercel-shop:architect-storefront
---

## Summary

Add a short, always-on architecture contract to the template's agent guidance. It defines ownership across routes, Shopify operations, Server Components, client islands, and server actions, then protects the route's dependency graph, cache boundaries, shell, loading states, media, and prefetch behavior.

The detailed route-specific workflow lives in the `architect-storefront` plugin skill so the generated scaffold stays concise.

This supersedes the narrower `storefront-performance` skill and contract from 2026-06-22. Performance remains a verification outcome; architecture is now the primary workflow.

## Why it matters

The presentation scaffold is intentionally blank. Without explicit architecture, a redesign can keep the same visual result while accidentally serializing independent Shopify reads, moving public data to client effects, sharing personalized data, hiding primary content behind a broad boundary, or expanding the hydration and prefetch surface.

## Apply when

- Adopt for any storefront that uses agents to create or substantially replace route presentation.
- Adopt when the storefront retains the template's Cache Components and partial-prefetching architecture.

## Safe to skip when

- Skip only when the downstream project has equivalent route layering, data ownership, cache, streaming, client-boundary, and mutation rules in its own agent guidance.

## Validation

1. Confirm the downstream `AGENTS.md` describes route orchestration, data ownership, blocking dependencies, Suspense, client islands, mutation invalidation, images, and prefetch expectations.
2. If the Vercel Shop plugin is installed, invoke `/vercel-shop:architect-storefront` and confirm it routes to the relevant page reference.
