---
description: Audit an existing Vercel Shop project against the current recommended template version without modifying files.
---

# Check Vercel Shop drift

Use this command in an existing Vercel Shop project when the user wants to know how far the app has drifted from the current recommended template version.

## Read these inputs

1. `.vercel-shop/bootstrap.json` in the project root
2. `template-version.json` from this plugin
3. `AGENTS.md`
4. `.claude/settings.json` if present

## Audit goals

Compare the bootstrapped template version against the current recommended template version that ships with this plugin. This is a read-only audit.

## Report format

Return a concise audit with:

- original scaffold version
- current recommended template version
- version gap status
- whether the project still has the expected plugin setup
- whether the project still follows core Vercel Shop conventions
- next recommended follow-up actions

## Drift indicators to check

- missing `.vercel-shop/bootstrap.json`
- missing `AGENTS.md`
- missing project-scoped plugin config in `.claude/settings.json`
- legacy local skill files such as `.agents/skills/`
- legacy `.claude/skills` symlink
- obvious divergence from expected Vercel Shop structure such as missing `lib/shopify/` or `components/`

## Important behavior

- Do not edit files.
- If `.vercel-shop/bootstrap.json` is missing, say that the project predates plugin bootstrap metadata and continue with a best-effort heuristic audit.
- If the original scaffold version matches the current recommended version, say so explicitly.
