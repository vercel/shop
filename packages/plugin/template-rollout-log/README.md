# Template Rollout Log

This directory is the change-level rollout log for the shop template.

Use it when a template update may need to be reviewed or selectively adopted by existing storefronts. A template version alone is too coarse because downstream apps often take only part of the template over time.

## Rules

- Add one new markdown file per rollout-worthy template change.
- Keep the log append-only. Do not rewrite old entries unless they are factually wrong.
- Keep entries narrow. One entry should describe one change or one tightly related set of edits.
- Prefer concrete file paths, behavior changes, and validation steps over vague summaries.
- Note when a change is optional, only applies with another feature, or is safe to skip.

## File naming

Use a date-first slug so entries sort naturally:

```text
YYYY-MM-DD-short-change-name.md
```

## Suggested entry shape

```md
---
title: Short change title
changeKey: locale-routing-alternates
introducedInVersion: 0.1.0
introducedOn: 2026-04-14
changeType: feature | fix | breaking | refactor | dependency | docs | meta
defaultAction: adopt | review | ignore
appliesTo:
  - all
paths:
  - app/example/page.tsx
relatedSkills:
  - /vercel-shop:enable-shopify-markets
---

## Summary

What changed in the template.

## Why it matters

Why a downstream storefront might want this.

## Apply when

Signals that the change is relevant.

## Safe to skip when

Cases where the change should not be rolled out.

## Validation

Concrete checks an agent can run after applying it.
```

## Frontmatter guidance

- `changeKey`: stable identifier for the rollout item
- `introducedInVersion`: optional template version that first included the change
- `introducedOn`: optional calendar date the change landed in the template
- `changeType`: categorize the change for triage
- `defaultAction`: the default recommendation for downstream projects
- `appliesTo`: use `all` or a short list such as `markets-enabled`, `auth-enabled`, `cms-enabled`
- `paths`: relevant template files or directories
- `relatedSkills`: optional plugin commands or skills that help apply the change

Agents should prefer `introducedOn` and the bootstrap `scaffoldedAt` timestamp when ordering rollout candidates. Versions are only hints.

## Scope

Only log changes that downstream storefronts may reasonably want to compare, adopt, or consciously skip.

Do not add entries for every docs-only tweak, typo fix, or purely local maintenance task unless it changes rollout guidance for downstream projects.
