# Shop Docs Guide

This file provides guidance for agents working in the docs.

## Expected Project Plugins

This project works best when the monorepo plugins are installed in project scope:

```bash
npx plugins add vercel/shop --scope project --yes
npx plugins add vercel/vercel-plugin --scope project --yes
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
```

- `vercel-shop` provides the canonical storefront skills that the docs site renders and references.
- `vercel-plugin` provides generic Vercel and Next.js skills.
- `shopify-ai-toolkit` provides Shopify-aware tooling and schema access.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
