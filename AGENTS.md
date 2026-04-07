# Vercel Shop Monorepo

This is a monorepo for developing a template, docs site, and skills for building commerce storefronts with Next.js and deploying to Vercel.

## Docs

The docs app is in apps/docs using [fromsrc](https://www.fromsrc.com). It is linked to the vercel-labs/shop-docs project on Vercel.

## Template

The main app in this monorepo is apps/template, which is a template/reference architecture for building commerce storefronts with Next.js. Learn more by reading the AGENTS.md in the directory. It is linked to the vercel-labs/shop-template project on Vercel. You MUST check if a feature being updated in the template is documented in the docs application. If so, also update the documentation.

## Skills

Skills to be used by the template and docs are written to apps/template/.agent/skills When a skill in that directory gets updated, you MUST ask if that skill should be updated in the docs as well via the docs skill sync script.