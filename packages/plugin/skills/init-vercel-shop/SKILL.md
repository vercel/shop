---
name: init-vercel-shop
description: Initialize a new Vercel Shop storefront with the official create-vercel-shop CLI. Use when the user wants to create, scaffold, start, or initialize a Vercel Shop project from a coding agent.
---

# Initialize Vercel Shop

Ask for the target directory if the user did not provide one. Always pass it explicitly.

1. Inspect the target. If it already contains a Vercel Shop project, stop and use the relevant storefront skill instead. If it is a non-empty directory, ask for a different target rather than overwriting files.
2. Run:

   ```bash
   npx create-vercel-shop@latest <target-directory>
   ```

   Preserve an explicitly requested package manager with `--use-pnpm`, `--use-npm`, `--use-yarn`, or `--use-bun`.
3. Confirm the generated project contains `.vercel-shop/bootstrap.json`, `.agents/skills/`, `AGENTS.md`, `app/`, `components/`, `lib/shopify/`, and `package.json`.
4. Read the generated `AGENTS.md` before making further changes.
5. If `.agents/skills/` is missing, keep the generated project and restore the inlined agent skills from the project root:

   ```bash
   npx create-vercel-shop@latest --no-template
   ```

   Optionally offer the recommended companion plugins if the user's agent supports them:

   ```bash
   npx plugins add vercel/vercel-plugin --scope project --yes
   npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
   ```

6. Ask one optional follow-up: **Connect an existing Shopify store now?**

   If yes, ask only for the store's admin URL or `.myshopify.com` domain, then read [references/storefront-token.md](references/storefront-token.md) and follow its automated Shopify CLI flow. Try to reuse or create a public Storefront token before asking the user to visit the Headless channel.

   If no, finish with the normal environment setup as the next step.

Return the generated project path, whether a Shopify store was connected, and whether the inlined agent skills needed a retry.
