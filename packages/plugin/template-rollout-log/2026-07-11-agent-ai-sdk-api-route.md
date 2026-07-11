---
title: Move the shopping assistant from eve back to a guarded AI SDK route
changeKey: agent-ai-sdk-api-route
introducedOn: 2026-07-11
changeType: refactor
defaultAction: review
appliesTo:
  - storefronts-with-agent
paths:
  - apps/template/app/api/chat/route.ts
  - apps/template/lib/agent/
  - apps/template/components/agent/
  - apps/template/next.config.ts
  - apps/template/package.json
  - apps/template/AGENTS.md
---

## Summary

The shopping assistant no longer runs through eve or `/eve/v1`. It uses a feature-guarded `POST /api/chat` Next.js Route Handler, AI SDK's `ToolLoopAgent`, and `@ai-sdk/react`'s `useChat`.

- The endpoint returns `404` before parsing the request or creating a cart unless `NEXT_PUBLIC_ENABLE_AGENT="1"`.
- The route validates UI messages, resolves trusted product/collection context from the `Referer`, creates the cart before streaming, and can return the cart cookie in response headers.
- The 14 tools live under `lib/agent/tools/` and use the normal Shopify operation layer. The three Storefront MCP tools remain available.
- json-render returns to the server-side `pipeJsonRender` plus client-side `useJsonRenderMessage` path.
- Chat state is browser-local (`template-agent-chat:v3`) rather than a durable Workflow session.
- The `eve` dependency, `withEve()`, `agent/` tree, and Eve runtime artifacts are removed; `@ai-sdk/react` is restored.

## Why it matters

This removes the separate Eve/Workflow runtime and keeps the assistant inside the standard Next.js request lifecycle. Cart mutations now naturally use the operation wrappers that enforce cache invalidation, and page context is resolved from trusted server-side data. The tradeoff is that conversations are no longer durable across browsers or devices.

## Apply when

- The storefront adopted the Eve migration and wants a conventional guarded API route.
- The storefront does not need Workflow-backed durable sessions, channels, approvals, or subagents.
- Agent tools should share the same Next.js Shopify operation and invalidation layer as the storefront.

## Safe to skip when

- Durable/resumable Eve sessions are required.
- The storefront uses additional Eve channels, HITL flows, subagents, or workflow hooks.
- A custom backend already owns the agent transport and persistence model.

## Validation

1. With `NEXT_PUBLIC_ENABLE_AGENT` unset, confirm the assistant is hidden and `POST /api/chat` returns `404`.
2. With the flag set, confirm text streams and product cards render after the turn settles.
3. Exercise add, update, remove, note, and get-cart tools; verify mutations update the cart UI and a first chat can set the cart cookie.
4. Exercise `searchCatalog` and `searchShopPoliciesAndFaqs` when Storefront MCP is enabled.
5. Reload to confirm browser-local history returns, then clear the chat to confirm a new ID and empty history.
6. Run `pnpm --filter template exec tsc --noEmit`, `pnpm --filter template lint`, and `pnpm --filter template build`.
