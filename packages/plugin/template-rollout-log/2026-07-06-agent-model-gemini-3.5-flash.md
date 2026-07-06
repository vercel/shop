---
title: Switch the agent model to Google Gemini 3.5 Flash
changeKey: agent-model-gemini-3.5-flash
introducedOn: 2026-07-06
changeType: dependency
defaultAction: review
appliesTo:
  - storefronts-with-agent
paths:
  - apps/template/agent/agent.ts
---

## Summary

The eve shopping assistant's model was switched from `anthropic/claude-sonnet-4.6` to `google/gemini-3.5-flash` (a one-line change in `agent/agent.ts`). The model string routes through the Vercel AI Gateway; nothing else about the agent (tools, instructions, channel auth, UI) changed.

## Why it matters

Gemini 3.5 Flash is a fast, lower-cost model that still follows the json-render spec DSL the assistant's generative UI depends on — product cards, grids, cart summary, and variant picker all render correctly. For a storefront assistant, that's a cost/latency win over the previous Sonnet default without losing the rich card UI.

**Model floor matters here.** Cheaper Gemini tiers do **not** work: `google/gemini-3.1-flash-lite` malforms the json-render bindings (it emits an image `src` as the literal string `{ $item: 'image' }` instead of a real binding), which throws in `next/image` and renders no cards. If you drop below `gemini-3.5-flash`, re-verify the generative UI before shipping — a model that produces fine prose can still break the cards.

## Apply when

- Your storefront runs the eve agent and you want a cheaper/faster model that still renders the generative product UI.

## Safe to skip when

- You pin a specific model for output-stability, quality, or provider reasons — model choice is a conscious tradeoff, so this is `review`, not `adopt`.
- The agent is disabled (`NEXT_PUBLIC_ENABLE_AGENT` unset).

## Validation

- Confirm the target is live in your gateway: `GET https://ai-gateway.vercel.sh/v1/models` should list `google/gemini-3.5-flash`.
- With `NEXT_PUBLIC_ENABLE_AGENT=1` in dev: ask for product recommendations and confirm **product cards render with images** (not just text) and that the dev overlay shows no `[json-render] Rendering error` / `Invalid URL` for `<AgentProductCard>`. Also exercise a cart mutation so the cart-confirmation card is checked.
