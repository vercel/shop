---
title: Rebuild the agent chat UI (retire ai-elements)
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
  - apps/template/components/ui/bubble.tsx
  - apps/template/components/ui/marker.tsx
  - apps/template/app/globals.css
  - apps/template/package.json
---

## Summary

The AI assistant's chat UI was rebuilt from scratch and the local `components/ai-elements/` set is **deleted**. The eve data flow (`useEveAgent`/`EveMessage`), Streamdown markdown, and the `@json-render` product-card specs (`agent/registry.tsx`, `agent/eve-json-render.ts`) are unchanged — only the presentation and scroll layer moved.

We first tried adopting shadcn's full chat set (`MessageScroller`, `Message`, `Bubble`, `Marker`), but `MessageScroller`'s streaming auto-scroll and `Message`/`MessageContent`'s flex column fought the eve stream (scroll jank, new-turn jumps, flex-shrunk/clipped cards, a partial-spec card flash). Rather than keep patching an opinionated scroller, the chat is now a small set of agent-local components built on a few clean, unopinionated primitives:

- **`agent/agent-panel.tsx`** — a **fixed-height** panel (no resize jank) whose message column is **bottom-anchored** (`flex min-h-full flex-col justify-end` with `[&>*]:shrink-0`): short chats hug the composer with no dead gap, long chats scroll, and cards keep their intrinsic height. Stick-to-bottom is a single `ResizeObserver` on the content that pins to the live edge on **any** growth — streaming text, a late-rendered card, an image loading in — unless the reader has scrolled up (a scroll handler clears the pin past a 48px threshold). This replaced the `use-stick-to-bottom` wrapper and the earlier `MessageScroller`.
- **`agent/chat-message.tsx`** — user turn → a right-aligned `Bubble` (`variant="default"`, i.e. the primary color, matching the Add-to-Cart button); assistant turn → a **flat, full-width** block (no bubble, avatar, or copy action) with reasoning, Streamdown, then the `@json-render` `Renderer`. The card is gated on `!isStreaming`, so the mid-stream partial spec fence never compiles to a wrong/half card (the "card flash").
- **`agent/reasoning.tsx`** — a `Collapsible` (`ui/collapsible.tsx`) with a `shimmer` "Working…" / "Worked through N steps" header and one `Marker` (`ui/marker.tsx`) per reasoning/tool step (plain text, no icons; active step shimmers). Auto-collapse fires **once, only on the active→done transition** (tracked by a ref) — it never collapses a restored/complete block or fights a manual expand.
- **`agent/composer.tsx`** — a slim composer on the existing `ui/input-group.tsx` + `ui/button.tsx`, replacing the ~40-export `ai-elements/prompt-input.tsx` (only 5 were used). Enter-to-send, status-driven submit icon (submitted→spinner, streaming→stop, error→x, else send).

Removed: the entire `components/ai-elements/` directory, `components/ui/message-scroller.tsx` and `components/ui/message.tsx`, and the `@shadcn/react` + `use-stick-to-bottom` dependencies. `ui/bubble.tsx` and `ui/marker.tsx` (Base UI variants, added via `shadcn add`) are kept as the two visual primitives that stayed clean.

CSS: the reasoning header uses a `shimmer` utility inlined into `app/globals.css` (matching the template's hand-authored `@utility` convention); the old inline `Shimmer` component was removed. `attachment` was not adopted (the agent has no file-upload feature).

## Why it matters

The old `ai-elements/` UI worked but carried latent streaming-scroll and layout jank. The rebuild fixes it at the foundation: a fixed panel + bottom-anchored column + one `ResizeObserver` is far simpler than a bespoke scroller and behaves like a standard chat (ChatGPT/Claude-style) — short chats sit at the composer, streaming stays pinned, and manual scroll-up is respected. Gating cards on turn completion removes the partial-spec flash. Keeping only `Bubble`/`Marker` avoids the opinionated `MessageScroller`/`Message` behaviors that caused the regressions.

## Apply when

- Your storefront runs the eve agent with the template's `ai-elements/` chat UI and wants the simpler, less janky panel + scroll.

## Safe to skip when

- You've customized the `ai-elements/` chat UI heavily, or you're staying on a different chat stack.
- The agent is disabled (`NEXT_PUBLIC_ENABLE_AGENT` unset) and you don't ship the assistant.

## Validation

- `pnpm --filter template build` and a real typecheck (`./node_modules/.bin/tsc --noEmit` — plain `npx tsc` resolves a decoy package) pass; grep shows no `@/components/ai-elements` / `../ai-elements` imports and no `use-stick-to-bottom` / `@shadcn/react` / `MessageScroller`.
- With `NEXT_PUBLIC_ENABLE_AGENT=1` in dev: open the panel → greeting hugs the composer (no top gap); send a message → right-aligned primary user bubble, collapsible reasoning (no icons) that expands and stays open with per-step markers, flat full-width assistant response with Streamdown, product card renders in full only after the turn settles, and the view stays pinned to the bottom (`scrollHeight − scrollTop − clientHeight ≈ 0`) with a constant panel height throughout streaming; scroll-up reaches the top; clear-chat remounts a fresh session.
