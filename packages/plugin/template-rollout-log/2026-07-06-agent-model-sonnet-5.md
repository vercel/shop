---
title: Upgrade the agent model to Claude Sonnet 5
changeKey: agent-model-sonnet-5
introducedOn: 2026-07-06
changeType: dependency
defaultAction: review
appliesTo:
  - storefronts-with-agent
paths:
  - apps/template/agent/agent.ts
---

## Summary

The eve shopping assistant's model was bumped from `anthropic/claude-sonnet-4.6` to `anthropic/claude-sonnet-5` (a one-line change in `agent/agent.ts`). The model string routes through the Vercel AI Gateway; nothing else about the agent (tools, instructions, channel auth, UI) changed.

## Why it matters

Sonnet 5 is the newer Sonnet generation available through the AI Gateway. For a storefront assistant that reasons over the catalog, calls tools, and emits json-render specs, the newer model generally improves instruction-following and tool use at a comparable tier.

## Apply when

- Your storefront runs the eve agent and you want the current default Sonnet generation.

## Safe to skip when

- You pin a specific model for cost, latency, or output-stability reasons — model choice is a conscious tradeoff, so this is `review`, not `adopt`.
- The agent is disabled (`NEXT_PUBLIC_ENABLE_AGENT` unset).

## Validation

- Confirm the target is live in your gateway: `GET https://ai-gateway.vercel.sh/v1/models` should list `anthropic/claude-sonnet-5`.
- With `NEXT_PUBLIC_ENABLE_AGENT=1` in dev: send a message and confirm a streamed reply with no gateway/model errors (tool calls, product cards, and cart mutations still work).
