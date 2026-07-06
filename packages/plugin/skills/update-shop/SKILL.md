---
name: update-shop
description: Update an existing Vercel Shop storefront with newer template changes. Use when the user wants to check drift, plan an upgrade, or apply template updates to a project scaffolded from Vercel Shop.
---

# Update Vercel Shop

Bring an existing Vercel Shop project up to date with the template by reasoning about individual rollout entries, never by diffing against a template version. Downstream storefronts often adopt only part of the template, so every decision must be validated against the current codebase.

## Pick a mode

Infer the mode from the user's request:

- **Audit** — report how far the project has drifted. Read-only; stop after the audit phase.
- **Plan** — produce a change-level upgrade plan. Read-only; stop after the plan phase.
- **Apply** — plan, confirm the selection with the user, then apply and validate. Use this when the user asks to "update" or "upgrade" the shop.

## Read these inputs

1. `.vercel-shop/bootstrap.json` in the project root — original `templateVersion` and `scaffoldedAt`
2. `.vercel-shop/rollout-state.json` in the project root — decisions recorded by earlier runs of this skill (may not exist)
3. `template-version.json` from this plugin
4. Every markdown entry in `template-rollout-log/` from this plugin except `README.md`
5. `AGENTS.md` and `.claude/settings.json` in the project if present
6. The current project structure and any files named by matching rollout entries

If `.vercel-shop/bootstrap.json` is missing, say the project predates plugin bootstrap metadata and continue with a best-effort heuristic audit.

## Phase 1 — audit

Compare the scaffold metadata against the current recommended template version and check for structural drift:

- missing `.vercel-shop/bootstrap.json`
- missing `AGENTS.md`
- missing project-scoped plugin config in `.claude/settings.json`
- legacy local skill files such as `.agents/skills/` or a legacy `.claude/skills` symlink
- obvious divergence from the expected Vercel Shop structure such as missing `lib/shopify/` or `components/`

Report the original scaffold version, the scaffold timestamp, the current recommended template version, and a short note on overall drift. If the scaffold version matches the current version, say so explicitly. In audit mode, stop here.

## Phase 2 — plan

Build the candidate list from the rollout log:

1. If bootstrap metadata includes `scaffoldedAt`, treat entries with a newer `introducedOn` as the primary candidates. Versions are only hints.
2. Add older entries that still look applicable from the current project state.
3. Drop entries that `.vercel-shop/rollout-state.json` already records as adopted, skipped, or not applicable — unless the user asks to revisit them.

For each remaining entry, decide one of:

- **Adopt now** — clearly applicable and mechanical enough to apply confidently
- **Review manually** — applicable but touches heavily customized code
- **Already present** — the project has the change (adopted independently or scaffolded with it)
- **Not applicable** — the entry's `appliesTo` or preconditions don't match this project

Validate each decision against the current codebase. Do not assume a change is missing just because the scaffold is old, and do not invent upgrade work when no entries apply — say so explicitly. Call out uncertainty when the project has heavily diverged from template conventions.

Present the plan grouped by decision. In plan mode, stop here and do not edit files.

## Phase 3 — apply

Confirm with the user which entries to apply before editing anything. Then, for each selected entry, one at a time:

1. Re-read the entry's Summary, `paths`, and Apply when / Safe to skip when sections.
2. Apply the change in the project's own idiom — re-implement the behavior described by the entry rather than copying template files over customized code. Use the entry's `relatedSkills` when listed.
3. Run the entry's Validation steps before moving to the next entry.
4. Keep each entry's edits an isolated, reviewable unit. If the project uses git and the user wants commits, suggest one commit per `changeKey`.

If an entry's validation fails, stop, report the failure, and ask whether to fix forward, skip the entry, or revert its edits before continuing.

## Phase 4 — record and report

Record every decision in `.vercel-shop/rollout-state.json` so future runs don't re-litigate settled entries. Keep decisions keyed by `changeKey`:

```json
{
  "decisions": {
    "storefront-typed-client": {
      "decision": "adopted",
      "decidedOn": "2026-07-06"
    },
    "pdp-metafields-specs": {
      "decision": "skipped",
      "decidedOn": "2026-07-06",
      "note": "custom PDP replaced the specs section"
    }
  }
}
```

Use `adopted`, `skipped`, `not-applicable`, or `already-present` as decision values. Do not modify `.vercel-shop/bootstrap.json` — `scaffoldedAt` must keep describing the original scaffold.

Finish with a concise report: what was applied, what was skipped and why, validation results, and any entries deferred for manual review.
