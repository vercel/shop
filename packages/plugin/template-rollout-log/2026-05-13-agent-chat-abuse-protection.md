---
title: Protect /api/chat with BotID, rate limit, and token cap
changeKey: agent-chat-abuse-protection
introducedOn: 2026-05-13
changeType: feature
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/app/api/chat/route.ts
  - apps/template/instrumentation-client.ts
  - apps/template/lib/agent/rate-limit.ts
  - apps/template/lib/agent/server.ts
  - apps/template/next.config.ts
  - apps/template/package.json
---

## Summary

The agent chat endpoint now hardens three abuse vectors before any model call or cart write:

1. Vercel BotID via the `botid` package (`withBotId(nextConfig)`, `initBotId()` in `instrumentation-client.ts`, `checkBotId()` on the POST handler).
2. Per-IP sliding-window-log rate limit (`lib/agent/rate-limit.ts`, 20 req / 60 s) backed by Vercel Runtime Cache (`getCache` from `@vercel/functions`). Regional and eventually consistent; concurrent reads can over-admit by a small constant, which is acceptable for abuse mitigation.
3. `maxOutputTokens: 8192` cap on the `ToolLoopAgent` defaults — sized to fit a full generative-UI response (multi-card grid + cart summary + surrounding text) while still bounding worst-case gateway spend per call.

Bot and rate-limit checks run before `request.json()` and before `createCartWithoutCookie()`, so a flood of bot traffic no longer creates Shopify carts or burns gateway spend.

## Why it matters

The previous handler was reachable anonymously with no bot protection, no rate limit, and no token ceiling. A scripted client could spawn unbounded Shopify cart records and AI gateway calls. This change closes that path with platform-native primitives.

## Apply when

- The storefront ships the AI shopping agent (default).
- The storefront deploys to Vercel and can enable BotID Deep Analysis in the Firewall tab.

## Safe to skip when

- The storefront has set `AI_AGENT_DISABLED` and does not expose `/api/chat`.
- The storefront already routes `/api/chat` behind its own bot/abuse infrastructure (Cloudflare, WAF, etc.) — in that case still keep the `maxOutputTokens` cap.

## Validation

1. `pnpm --filter template lint` and `pnpm --filter template build` should pass.
2. `curl -X POST http://localhost:3000/api/chat -H 'content-type: application/json' -d '{"chatId":"x","messages":[]}'` from a non-browser context returns 403 on a production Vercel deployment with BotID Deep Analysis enabled (local dev returns the normal response per botid local-dev behavior).
3. Firing >20 requests in 60 s from the same IP returns `429` with a `Retry-After` header.
4. Confirm `lib/agent/server.ts` `defaults.maxOutputTokens` is set.
