# Vercel Shop Monorepo

This is a monorepo for developing a template, docs site, and skills for using Next.js with Shopify and deploying to Vercel.

## Docs

The docs app is in apps/docs using the package-based Geistdocs architecture ([`@vercel/geistdocs`](https://www.npmjs.com/package/@vercel/geistdocs)). See apps/docs/AGENTS.md for editing conventions.

## Template

* The main app in this monorepo is apps/template, which is a template/reference architecture for using Shopify and Next.js. Learn more by reading the AGENTS.md in the directory.
* You MUST check if a feature being updated in the template is documented in the docs application. If so, also update the documentation.
* Template rollout changelog entries are paused. Do not require or add an entry to `packages/plugin/template-rollout-log/` for pull requests.

## Skills

Skills to be used by the template and docs are written to `packages/plugin/skills`.
When a skill in that directory gets updated, you MUST ask if that skill should be updated in the docs as well via the docs skill sync script.

## Environment files

`.env.example` files are examples, not secret manifests — never use redaction language like `[redacted]` or `<secret>` in them. Use realistic placeholders: Shopify values get their real format or prefix (`your-store.myshopify.com`, `shp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`, a sample Storefront token), and everything else gets a `your-…-here`-style string (`your-session-secret-here`).
