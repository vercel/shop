---
description: Bootstrap a new Vercel Shop project and confirm the project-scoped plugin setup landed correctly.
---

# Bootstrap a Vercel Shop project

Use this command when the user wants to start a new Vercel Shop codebase from scratch, from prompts, or in a fresh directory.

## Before you run anything

1. Check whether the current directory already looks like a Vercel Shop app.
2. Treat the project as an existing Vercel Shop app if it already has all of these:
   - `AGENTS.md`
   - `app/`
   - `lib/shopify/`
   - `components/`
   - `package.json`
3. If it is already a Vercel Shop app, stop and tell the user to use the normal `vercel-shop` feature skills instead of scaffolding again.
4. Ask for a target directory if the user did not provide one. Prefer an explicit directory name such as `my-store`.

## Run the scaffold

Use the official CLI:

```bash
npx create-vercel-shop@latest <target-dir>
```

The scaffold is expected to:

- create the project from the `apps/template` example
- install these project-scoped plugins:
  - `vercel/shop`
  - `vercel/vercel-plugin`
  - `Shopify/shopify-ai-toolkit`
- write `.vercel-shop/bootstrap.json` in the generated app

## After the scaffold finishes

1. Open the generated project.
2. Confirm `.vercel-shop/bootstrap.json` exists.
3. Confirm the project now has plugin configuration in `.claude/settings.json`.
4. Read the generated `AGENTS.md` before making code changes.

## If plugin installation fails

Do not roll back the scaffolded app. Keep the generated project and show the exact retry commands:

```bash
npx plugins add vercel/shop --scope project --yes
npx plugins add vercel/vercel-plugin --scope project --yes
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
```

## Expected result

Return a short summary that includes:

- the generated project path
- whether `.vercel-shop/bootstrap.json` exists
- whether project-scoped plugins were installed automatically or need manual retry
