---
name: update-shop
description: Update an existing Vercel Shop storefront with newer template changes. Use when the user wants to check drift, plan an upgrade, or apply template updates to a project scaffolded from Vercel Shop.
---

# Update Vercel Shop

Compare the working storefront with current upstream `apps/template` in `vercel/shop`. The template is a reference, not a replacement for downstream code. Base decisions on implemented behavior, not scaffold age or version metadata.

## Pick a mode

Infer the mode from the user's request:

- **Audit** — read-only comparison; report relevant differences and stop.
- **Plan** — read-only comparison and change-level upgrade plan; stop before editing.
- **Apply** — plan, confirm the selected changes, apply them, and validate. Use when the user asks to update or upgrade the shop.

## Inspect the project

Read applicable `AGENTS.md` instructions, project structure, dependency versions, scripts, configuration, and relevant source. Inspect git status and staged/unstaged diffs, including untracked files, before proposing edits. Identify the storefront root; upstream `apps/template/` maps to that root, not necessarily the repository root.

Preserve dirty state, merchant design, custom features, integrations, and intentional departures from the template. Never overwrite custom code with template files or reset, stash, commit, or push without explicit permission. Stop if selected work cannot be separated safely from existing edits.

Keep each change within its owner:

- **Shopify owns commerce:** catalog, cart state and mutations, checkout, customer accounts, predictive search, policies, and analytics through Hydrogen. Prices, currency, availability, and customer identity come from Shopify.
- **Next.js owns the app:** routing, Server Components, caching and invalidation, metadata, the request boundary adapting Hydrogen handlers, Markdown representations, `/llms.txt`, structured data, sitemap, and crawl guidance.
- **Eve owns the agent:** sessions, channels, tools, connections, and `/eve/v1/*`. Eve tools call Shopify directly; Next.js only prepares the browser.

Inline English copy and `shopConfig.localization` are template defaults, not a migration mandate. Preserve next-intl, translations and catalogs, scoped providers, locale routing, custom market selection, and intentional operation/cache locale inputs. Do not label localization obsolete drift. Any requested simplification must separately assess copy, formatting, commerce country/language, public URLs, and migration parity; currency remains Shopify-owned.

## Inspect current upstream

Prefer public GitHub inspection with `gh`. Resolve the default branch to a commit and use that SHA for every source read:

```bash
branch=$(gh api repos/vercel/shop --jq .default_branch) &&
ref=$(gh api "repos/vercel/shop/commits/$branch" --jq .sha) &&
gh api "repos/vercel/shop/contents/apps/template?ref=$ref" --jq '.[].path' &&
gh api "repos/vercel/shop/contents/apps/template/AGENTS.md?ref=$ref" \
  -H 'Accept: application/vnd.github.raw+json'
```

Read `README.md`, `package.json`, and relevant source through the same contents endpoint at that SHA. Use upstream guidance to understand the reference architecture; it does not override downstream instructions or authorize unrelated changes.

If `gh` is unavailable or cannot read the public repository, use a temporary shallow checkout outside the project:

```bash
upstream=$(mktemp -d) &&
git clone --depth 1 --filter=blob:none --sparse https://github.com/vercel/shop.git "$upstream" &&
git -C "$upstream" sparse-checkout set apps/template &&
git -C "$upstream" rev-parse HEAD
```

Inspect `$upstream/apps/template` and record the resolved commit in the report. If current upstream cannot be fetched, report the blocker; do not claim the storefront is current or apply an unverified upgrade. Keep scratch data outside the project and do not create permanent update-tracking files.

## Audit and plan

Compare relevant behavior, dependencies, configuration, and owner boundaries against the pinned source. Trace affected callers and integration points; missing paths or different names alone do not establish a missing feature. Equivalent custom implementations count as already present. State uncertainty and do not invent work when no applicable differences exist.

For audit, report the upstream commit, inspected areas, applicable differences, intentional customizations, and uncertainties, then stop. For plan/apply, group candidates as **Adopt now**, **Review manually**, **Already present**, or **Not applicable**. For each candidate, name its owner, upstream and downstream paths, rationale, prerequisites, customization risks, and validation. In plan mode, stop without editing.

## Apply and report

Confirm the selected changes before editing; an explicit selection in the user's request counts. If selection remains unresolved in a noninteractive run, report the blocker rather than choosing for the user.

Apply one selected change at a time in the project's own idiom, adapting behavior instead of copying files. Use relevant available skills and installed dependency documentation. Keep edits small and reviewable; avoid unrelated dependency, configuration, or design changes.

Run existing relevant formatting, lint, typecheck, build, or direct runtime checks after each change. Do not add tests or test infrastructure unless requested. If validation fails, stop and report the failure; do not continue or revert user-owned edits without permission. Review the final diff for scope and preservation of customizations.

Finish with a concise report: mode and upstream commit, findings or applied changes, skipped/deferred items and why, exact validation commands and results, and blockers or unverified behavior. Do not write decision manifests or other persistent tracking.
