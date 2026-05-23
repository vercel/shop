---
title: Route every storefront brand reference through siteConfig.name
changeKey: site-name-everywhere
introducedOn: 2026-05-23
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/nav/index.tsx
  - apps/template/components/footer/index.tsx
  - apps/template/app/layout.tsx
  - apps/template/app/about/page.tsx
  - apps/template/lib/agent/server.ts
  - apps/template/lib/i18n/messages/en.json
---

## Summary

Every user-facing "Vercel Shop" string in the template now reads from `siteConfig.name`, which already resolves `process.env.NEXT_PUBLIC_SITE_NAME ?? "Vercel Shop"`. Touched: nav logo, footer copyright (now wired to the existing `footer.copyright` i18n key it had been ignoring), `generator` metadata, About page metadata + body, agent system prompt, and the `footer.copyright` / `seo.defaultDescription` i18n entries (both now take a `{name}` arg).

The About page copy was also rewritten to be brand-neutral so an interpolated `siteConfig.name` reads naturally.

## Why it matters

Setting `NEXT_PUBLIC_SITE_NAME` now actually brands the whole storefront — previously several spots hardcoded "Vercel Shop" and silently desynced from the env var. Storefronts that ship with the literal "Vercel Shop" string in the nav and footer copyright look unfinished.

## Apply when

Your fork still has hardcoded "Vercel Shop" strings in nav, footer, About, layout metadata, or the agent prompt, or your `footer.copyright` i18n key isn't actually consumed by `components/footer/index.tsx`.

## Safe to skip when

You've already replaced the About page with custom copy and removed the brand string from the other spots — in that case adopt only the footer i18n wiring and skip the About rewrite.

## Validation

`pnpm --filter template dev` with `NEXT_PUBLIC_SITE_NAME` set to something distinctive (e.g. `Acme`). Verify it appears in: the nav logo, footer copyright line, About page title + body, `<title>` template, OpenGraph metadata, and the agent's first message context. Unset the var and confirm everything falls back to "Vercel Shop".
