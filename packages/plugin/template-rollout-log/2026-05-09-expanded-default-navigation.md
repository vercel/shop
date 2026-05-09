---
title: Expand default navigation and footer placeholder links
changeKey: expanded-default-navigation
introducedOn: 2026-05-09
changeType: enhancement
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/components/nav/index.tsx
  - apps/template/lib/config.ts
---

## Summary

The template now ships with fuller placeholder navigation defaults:

- The pre-nav `h-8` spacer is outside the sticky nav wrapper, so only the primary nav row sticks.
- The existing `Shop` item stays pointed at `/search`, but now includes nested placeholder product links for the mega menu.
- The footer has five placeholder link groups instead of starting empty.

## Why it matters

A richer default menu better demonstrates the storefront shell, including mega-menu layout and footer density, without requiring a Shopify menu to be configured first.

## Migration in this PR

- `components/nav/index.tsx` wraps the sticky `nav` separately from the top spacer.
- `lib/config.ts` expands `navItems` and populates `footerItems` with `#` placeholder links.

## Apply when

- The storefront still uses the template default `navItems` or `footerItems` as fallback content.
- The storefront wants a fuller visual default before Shopify-managed menus are wired in.

## Safe to skip when

- The storefront already sources navigation and footer links from Shopify, CMS content, or custom config.
- The storefront intentionally wants a minimal shell.

## Validation

1. Hover `Shop` at desktop width — the mega menu should open with five columns of placeholder links.
2. Open the mobile menu — nested Shop links should appear in the accordion.
3. Scroll the page — only the primary nav row should stick, not the `h-8` spacer.
4. Footer should render five link groups with placeholder links.
