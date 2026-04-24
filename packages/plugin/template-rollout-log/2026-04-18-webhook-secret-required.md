---
title: Require SHOPIFY_WEBHOOK_SECRET for webhook handler
changeKey: webhook-secret-required
introducedOn: 2026-04-18
changeType: breaking
defaultAction: adopt
appliesTo:
  - all
paths:
  - app/api/webhooks/shopify/route.ts
---

## Summary

The Shopify webhook handler no longer skips HMAC verification when `SHOPIFY_WEBHOOK_SECRET` is unset. It now returns `500 Webhook secret not configured` when the env var is missing or empty, and `401 Invalid signature` when the signature does not match.

## Why it matters

The previous fallback of "no secret = accept every request" was a silent cache-invalidation vector. Any unauthenticated caller could flush product, collection, inventory, and CMS caches by POSTing to `/api/webhooks/shopify`. Failing closed removes that footgun.

## Apply when

Any storefront that exposes `/api/webhooks/shopify` to the internet, which is every storefront deployed to Vercel. Adopt this unconditionally.

## Safe to skip when

Never safe to skip. The previous behavior was unsafe in production.

## Validation

- Set `SHOPIFY_WEBHOOK_SECRET` in Vercel project env vars (copy from Shopify Admin → Settings → Notifications → Webhooks).
- `curl -X POST https://your-domain/api/webhooks/shopify` with no headers → expect `401` (or `500` if the env var is not set).
- Trigger a real Shopify webhook → expect `200` with `tagsInvalidated` in the response.
