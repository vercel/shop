---
title: Consolidate drift audit and upgrade planning into the update-shop skill
changeKey: update-shop-skill
introducedOn: 2026-07-06
changeType: meta
defaultAction: adopt
appliesTo:
  - all
paths:
  - packages/plugin/skills/update-shop/SKILL.md
  - packages/plugin/commands/vercel-shop-check-drift.md
  - packages/plugin/commands/vercel-shop-plan-upgrade.md
  - apps/template/AGENTS.md
relatedSkills:
  - /vercel-shop:update-shop
---

## Summary

The `vercel-shop-check-drift` and `vercel-shop-plan-upgrade` commands are consolidated into a single `update-shop` skill with three modes: audit (read-only drift report), plan (read-only change-level upgrade plan), and apply (confirmed selection applied entry by entry with per-entry validation). Both commands remain as compatibility aliases pointing at the skill.

The apply flow records decisions in `.vercel-shop/rollout-state.json`, keyed by `changeKey`, so repeat runs skip entries already adopted, skipped, or judged not applicable instead of re-litigating the full rollout log. `.vercel-shop/bootstrap.json` stays untouched — `scaffoldedAt` keeps describing the original scaffold.

## Why it matters

Downstream storefronts get one entry point for staying current with the template, and repeated upgrade runs stay incremental because settled decisions persist in the project.

## Apply when

- The storefront uses coding agents with the Vercel Shop plugin and wants to adopt template changes over time.

## Safe to skip when

- Nothing to apply in the project itself beyond optionally mentioning the skill in agent guidance; the skill ships with the plugin.

## Validation

1. With the plugin installed, invoke `/vercel-shop:update-shop` in plan mode and confirm it reads `.vercel-shop/bootstrap.json`, the rollout log, and `.vercel-shop/rollout-state.json` if present.
2. After an apply run, confirm `.vercel-shop/rollout-state.json` records a decision per handled `changeKey` and `bootstrap.json` is unchanged.
