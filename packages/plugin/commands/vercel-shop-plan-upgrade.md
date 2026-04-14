---
description: Plan which template updates should be rolled into an existing Vercel Shop project by combining scaffold metadata, the template rollout log, and the current project state.
---

# Plan a Vercel Shop upgrade

Use this command in an existing Vercel Shop project when the user wants to know which template updates are worth carrying forward into a customized storefront.

## Read these inputs

1. `.vercel-shop/bootstrap.json` in the project root if it exists
2. `template-version.json` from this plugin
3. every markdown entry in `template-rollout-log/` from this plugin except `README.md`
4. `AGENTS.md`
5. `.claude/settings.json` if present
6. the current project structure and any obviously relevant files mentioned by matching rollout entries

## Core rule

Do not treat the template version as a complete migration plan. Use the rollout log to reason about individual changes because downstream projects may intentionally adopt only some of them. If bootstrap metadata includes `scaffoldedAt`, use that timestamp as the primary hint for which rollout entries are likely new to the project.

## What to do

1. Identify the original scaffold version if bootstrap metadata exists.
2. Identify the scaffold timestamp if bootstrap metadata includes `scaffoldedAt`.
3. Read the rollout log entries that are likely newer than the project based on `scaffoldedAt`, file dates, or version hints, plus any older entries that still look applicable from the current project state.
4. For each relevant entry, decide one of:
   - adopt now
   - review manually
   - not applicable
   - already present
5. Validate each decision against the current codebase. Do not assume a change is missing just because the version is old.
6. Call out uncertainty when a project has heavily diverged from template conventions.

## Report format

Return a concise upgrade plan with:

- original scaffold version if known
- scaffold timestamp if known
- current recommended template version
- a short note on overall drift
- `Adopt now` entries
- `Review manually` entries
- `Already present` entries
- `Not applicable` entries
- follow-up commands or skills to use for the selected work

## Important behavior

- This is a planning pass. Do not edit files unless the user explicitly asks you to apply selected updates.
- Prefer rollout log evidence over broad version assumptions.
- If `.vercel-shop/bootstrap.json` is missing, say the project predates bootstrap metadata and continue with a best-effort audit.
- If the rollout log has no applicable entries, say so explicitly instead of inventing upgrade work.
