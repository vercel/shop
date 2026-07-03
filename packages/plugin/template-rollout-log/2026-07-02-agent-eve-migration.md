---
title: Migrate the AI shopping assistant to eve
changeKey: agent-eve-migration
introducedOn: 2026-07-02
changeType: refactor
defaultAction: consider
appliesTo:
  - storefronts-with-agent
paths:
  - apps/template/agent/
  - apps/template/next.config.ts
  - apps/template/lib/shopify/operations/products.fetch.ts
  - apps/template/lib/shopify/operations/collections.fetch.ts
  - apps/template/lib/shopify/operations/cart.fetch.ts
  - apps/template/lib/shopify/storefront.core.ts
  - apps/template/components/agent/agent-panel.tsx
  - apps/template/components/agent/eve-json-render.ts
  - apps/template/components/agent/cart-reconciler.tsx
  - apps/template/lib/cart/action.ts
  - pnpm-workspace.yaml
---

## Summary

The shopping assistant moved off the hand-rolled Vercel AI SDK stack (`app/api/chat/route.ts` + a `ToolLoopAgent` in `lib/agent/server.ts` + `useChat`) onto **[eve](https://eve.dev)**, a filesystem-first durable-agent framework mounted into Next.js via `withEve()` in `next.config.ts`.

- **Agent lives in `agent/`**: `agent.ts` (`defineAgent({ model })`), `instructions.md` (system prompt + json-render rules), `channels/eve.ts` (guest auth that exposes `cartId` + `locale` from the cart cookie), 11 tools under `agent/tools/*.ts` (filenames are the model-facing tool names, hence **snake_case**), and `agent/lib/session.ts` (reads context from `ctx.session.auth.current.attributes`).
- **Client**: `agent-panel.tsx` swaps `useChat` → `useEveAgent()`; page path rides each turn as ephemeral `clientContext`; the eve session cursor + events persist to `localStorage` (`template-agent-chat:v2`).
- **json-render bridge**: eve owns the model loop, so the former server-side `pipeJsonRender` is replaced by a client-side `components/agent/eve-json-render.ts` that reconstructs the spec from the model's ` ```spec ` fence and feeds the unchanged `<Renderer>` + registry.
- **Next-free fetch cores**: eve's runtime can't import `next/cache` or `server-only`, so tools call new `lib/shopify/operations/{products,collections,cart}.fetch.ts` cores (also imported by the existing `"use cache"` wrappers — shared, not duplicated). The Storefront client was split into `storefront.core.ts` (Next-free) + `storefront.ts` (keeps `import "server-only"` and re-exports the core).
- **Deps/config**: added `eve` (in `minimumReleaseAgeExclude`), removed `@ai-sdk/react`, added `engines.node >=24`, gitignored `.eve/` + `.workflow-data/`, documented `AI_GATEWAY_API_KEY` in `.env.example`.

## Why it matters

Sessions are now durable and resumable via the Workflow SDK (Vercel Workflow in production; a local `.workflow-data` file in dev — no database). The agent is a set of ordinary files rather than a bespoke route + AsyncLocalStorage context, which is easier to extend (channels, subagents, HITL) later. Behavior is otherwise 1:1 with the previous assistant (same tools, same rendered components, same flows).

## Apply when

- The storefront still runs the pre-eve agent (`app/api/chat/route.ts` + `lib/agent/server.ts` + `useChat`).
- You want durable/resumable agent sessions, or plan to grow the assistant (extra channels, approvals, subagents).
- Note the hard constraint this surfaced: **agent tool code must not transitively import `next/cache`, `server-only`, or `next/headers`** — route data access through Next-free `*.fetch.ts` cores. This is the main porting effort for a storefront that customized the agent's tools.
