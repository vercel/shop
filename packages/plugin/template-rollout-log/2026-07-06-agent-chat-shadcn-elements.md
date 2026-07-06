---
title: Rebuild the agent chat UI on shadcn chat components
changeKey: agent-chat-shadcn-elements
introducedOn: 2026-07-06
changeType: refactor
defaultAction: consider
appliesTo:
  - storefronts-with-agent
paths:
  - apps/template/components/agent/agent-panel.tsx
  - apps/template/components/agent/chat-message.tsx
  - apps/template/components/agent/reasoning.tsx
  - apps/template/components/agent/composer.tsx
  - apps/template/components/ui/message.tsx
  - apps/template/components/ui/bubble.tsx
  - apps/template/components/ui/marker.tsx
  - apps/template/components/ui/message-scroller.tsx
  - apps/template/app/globals.css
  - apps/template/package.json
---

## Summary

The AI assistant's chat UI was rebuilt on shadcn's chat component set (shipped June 2026) instead of the local `components/ai-elements/` set, which is now **deleted**. The eve data flow (`useEveAgent`/`EveMessage`), Streamdown markdown, and the `@json-render` product-card specs (`agent/registry.tsx`, `agent/eve-json-render.ts`) are unchanged — only the presentation layer moved.

Added via `shadcn add message bubble marker message-scroller` (Base UI variants, since `components.json` `style` is `base-nova`), which also pulls the headless `@shadcn/react` dependency:

- **`ui/message-scroller.tsx`** (`@shadcn/react`) replaces the old `conversation.tsx` (use-stick-to-bottom + a manual overflow wrapper). Purpose-built streaming scroll: auto-follow while at the live edge, new-turn anchoring (`scrollAnchor` on user turns), jump-to-latest button. `use-stick-to-bottom` removed.
- **`ui/message.tsx` + `ui/bubble.tsx`** replace the old `message.tsx`. Messages now use `Message align="start|end"` + `Bubble`: user → `align="end"` default (primary) bubble; assistant → sparkles `MessageAvatar` + `muted` bubble, with a copy action in `MessageFooter`.
- **`ui/marker.tsx`** + existing `ui/collapsible.tsx` back the rebuilt reasoning display (`agent/reasoning.tsx`): a collapsible "Working…/Worked through N steps" with one `Marker` per reasoning/tool step (spinner while active → tool icon when done). Ports the old `TOOL_METADATA`, step-status, and auto-collapse-after-1s logic.
- **`agent/composer.tsx`** — a slim composer on the existing `ui/input-group.tsx` + `ui/button.tsx`, replacing the ~40-export `ai-elements/prompt-input.tsx` (only 5 were used). Enter-to-send, status-driven submit icon (submitted→spinner, streaming→stop, else send).

New agent-local components live under `components/agent/` (`chat-message.tsx`, `reasoning.tsx`, `composer.tsx`) since they're eve-specific glue, not general `ui/` primitives.

CSS: the MessageScroller viewport uses a `scroll-fade-b` edge-fade utility and the reasoning header uses a `shimmer` utility. Rather than depend on the `shadcn` CLI package for `@import "shadcn/tailwind.css"`, both utilities are inlined into `app/globals.css` (matching the template's existing hand-authored `@utility` convention). The old inline `Shimmer` component + its `--animate-shimmer` keyframe were removed. Base UI's `data-open`/`data-closed`/etc. variants and the chat components' bracket data-variants work natively in Tailwind v4 — no shadcn custom-variant CSS needed.

`attachment` was not adopted (the agent has no file-upload feature).

## Why it matters

shadcn's chat set is Base UI-backed (the template is already on Base UI), better-maintained, and its MessageScroller solves streaming-scroll edge cases the old use-stick-to-bottom wrapper handled crudely. The shadcn changelog notes it does not obsolete AI Elements, but for this template the shadcn primitives + a couple of small eve-specific components cover the whole surface, so `ai-elements/` was retired.

## Apply when

- Your storefront runs the eve agent with the template's `ai-elements/` chat UI and you want the shadcn chat components + Base UI consistency.

## Safe to skip when

- You've customized the `ai-elements/` chat UI heavily, or you're staying on AI Elements / a different chat stack.
- The agent is disabled (`NEXT_PUBLIC_ENABLE_AGENT` unset) and you don't ship the assistant.

## Validation

- `pnpm --filter template build` and a real typecheck (`./node_modules/.bin/tsc --noEmit` — plain `npx tsc` resolves a decoy package) pass; grep shows no `@/components/ai-elements` / `../ai-elements` imports and no `use-stick-to-bottom`.
- With `NEXT_PUBLIC_ENABLE_AGENT=1` in dev: open the panel → greeting + composer render; send a message → right-aligned user bubble, collapsible reasoning with per-step markers, assistant avatar + muted bubble with Streamdown, product-grid spec renders inside the bubble, streaming→send icon on the submit button, copy action on assistant messages, and MessageScroller auto-follows the stream.
