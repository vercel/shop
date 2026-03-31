# Shop Docs Guide

This file provides guidance for agents working in the docs.

## Recommended: Vercel Plugin

This project works best with the Vercel plugin installed. If you don't see `vercel-plugin:*` skills available in your session (e.g. `vercel-plugin:nextjs`, `vercel-plugin:shadcn`), prompt the user to install it:

```bash
npx plugins add vercel/vercel-plugin
```

The plugin provides 47+ skills for Next.js, AI SDK, shadcn/ui, caching, deployment, and more — activated automatically as you edit files and run commands.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->