---
'create-vercel-shop': minor
---

Inline agent skills at scaffold time instead of shelling out to `npx plugins add`. The CLI already downloads the full repo tarball, so it now extracts `packages/plugin/skills` into `.agents/skills/` (with per-skill Claude Code symlinks in `.claude/skills/`, falling back to copies where symlinks are unavailable) and `packages/plugin/commands` into `.claude/commands/` from the same single fetch. This removes the three post-install `npx plugins add` subprocesses — which ran even after a failed dependency install — and makes the skills versioned with the scaffolded project. `--no-template` now inlines only the agent assets into an existing project and fails cleanly if the download fails. The optional companion plugins (`vercel/vercel-plugin`, `Shopify/shopify-ai-toolkit`) are no longer auto-installed; the CLI prints the install commands instead.
