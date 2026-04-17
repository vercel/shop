# Vercel Shop Monorepo

This is a monorepo for developing a template, docs site, and skills for using Next.js with Shopify and deploying to Vercel.

## Docs

The docs app is in apps/docs using [fromsrc](https://www.fromsrc.com).

## Template

* The main app in this monorepo is apps/template, which is a template/reference architecture for using Shopify and Next.js. Learn more by reading the AGENTS.md in the directory.
* You MUST check if a feature being updated in the template is documented in the docs application. If so, also update the documentation.
* When a template change is something downstream storefronts may want to adopt later, add an entry to `packages/plugin/template-rollout-log/` so agents can reason about change-level rollout instead of only template versions.

## Skills

Skills to be used by the template and docs are written to `packages/plugin/skills`.
When a skill in that directory gets updated, you MUST ask if that skill should be updated in the docs as well via the docs skill sync script.
