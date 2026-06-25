---
title: Add the storefront performance contract to agent guidance
changeKey: storefront-performance-contract
introducedOn: 2026-06-22
changeType: meta
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
relatedSkills:
  - /vercel-shop:storefront-performance
---

## Summary

Add a short, always-on performance contract to the template's agent guidance. It preserves route loading and cache boundaries during presentation work and sets defaults for static-shell content, Suspense fallbacks, Server Components, images, and prefetching.

The detailed, route-specific workflow lives in the `storefront-performance` plugin skill so the generated scaffold stays concise.

## Why it matters

The presentation scaffold is intentionally blank. Without explicit constraints, a redesign can keep the same visual result while accidentally moving Shopify reads to the client, hiding LCP content behind an unrelated boundary, introducing layout shift, or turning dense grids into high-volume prefetch surfaces.

## Apply when

- Adopt for any storefront that uses agents to create or substantially replace route presentation.
- Adopt when the storefront retains the template's Cache Components and partial-prefetching architecture.

## Safe to skip when

- Skip only when the downstream project has equivalent performance rules in its own agent guidance.

## Validation

1. Confirm the downstream `AGENTS.md` describes its route, Suspense, Server Component, image, and prefetch expectations.
2. If the Vercel Shop plugin is installed, invoke `/vercel-shop:storefront-performance` and confirm it routes to the relevant page reference.
