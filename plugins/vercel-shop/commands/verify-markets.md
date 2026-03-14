---
name: verify-markets
description: >
  Generate and run Playwright e2e tests to verify Shopify Markets is working.
  Use after enable-markets has already been run, or to re-run verification.
---

# Verify Markets Setup

Standalone verification command for users who already enabled markets (manually or via `/vercel-shop:enable-markets`).

## Step 1: Pre-flight Checks

Before generating tests, verify that markets are actually enabled:

1. Read `lib/i18n.ts` and check that `enabledLocales` contains more than one locale.
   - If only one locale is enabled, tell the user:
     > Markets don't appear to be enabled yet — `enabledLocales` in `lib/i18n.ts` only has one locale. Run `/vercel-shop:enable-markets` first.
   - Stop here if markets aren't enabled.

2. Check if `lib/i18n/routing.ts` exists (it's created by the enable-markets skill).
   - If it doesn't exist, warn the user that routing config is missing and suggest running enable-markets first.

## Step 2: Check for Existing Tests

Check if `e2e/markets.spec.ts` already exists.

**If it exists**, ask:

```json
{
  "questions": [
    {
      "question": "e2e/markets.spec.ts already exists. What would you like to do?",
      "header": "Test file",
      "options": [
        {
          "label": "Regenerate from current config (Recommended)",
          "description": "Overwrites the existing test file with tests matching your current locale/routing config"
        },
        {
          "label": "Run existing tests",
          "description": "Run the tests as-is without regenerating"
        }
      ],
      "multiSelect": false
    }
  ]
}
```

**If it doesn't exist**, proceed directly to generation.

## Step 3: Generate Tests (if needed)

Execute the `generate-markets-e2e` skill from this plugin's `skills/generate-markets-e2e/SKILL.md`.

## Step 4: Run Tests

Run the Playwright tests:

```bash
bunx playwright test e2e/markets.spec.ts
```

## Step 5: Report Results

**If all tests pass:**
Report success. Mention which test suites passed (locale routing, currency, hreflang, sitemap, etc.).

**If some tests fail:**
For each failure:
1. Show the test name and error message
2. Identify the likely root cause based on the error
3. Suggest a specific fix

Common failure patterns and fixes:

| Failure | Likely cause | Fix |
|---|---|---|
| Locale URL returns 404 | Routes not moved under `app/[locale]/` | Check that `app/[locale]/` directory structure is correct |
| Wrong currency displayed | `localeCurrency` map missing entry | Add the locale's currency to `lib/i18n.ts` |
| Missing hreflang tags | `buildAlternates` not updated in `lib/seo.ts` | Update `buildAlternates` to include locale alternates |
| Sitemap missing locale URLs | `app/sitemap.ts` not updated | Add per-locale URL generation to sitemap |
| Locale switcher not found | Selector not wired into megamenu | Check `components/layout/nav/megamenu/index.tsx` |
| Locale switch doesn't navigate | `locale-currency.tsx` still using `next/navigation` router | Replace with `useRouter` from `@/lib/i18n/navigation` |

After reporting, ask if the user wants help fixing any failures.
