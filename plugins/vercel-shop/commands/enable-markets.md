---
name: enable-markets
description: >
  Enable Shopify Markets with multi-locale routing, then optionally generate
  and run Playwright e2e tests to verify the setup.
argument-hint: "[sub-path|per-domain]"
---

# Enable Markets + Verify

This command orchestrates the full markets enablement flow with optional e2e verification.

## Step 1: Delegate to the Enable Markets Skill

Run the existing enable-markets skill. Pass through any arguments the user provided.

Read and execute the skill at `apps/template/.agents/skills/enable-markets/SKILL.md`.
Pass `$ARGUMENTS` through — if the user specified `sub-path` or `per-domain`, use that as the routing strategy preference so the skill doesn't need to ask again.

Wait for the skill to complete all 15 steps (locale config, routing, middleware, link replacement, SEO, sitemap, translations, verification build).

## Step 2: Ask About E2E Tests

After the enable-markets skill finishes successfully, ask the user:

```json
{
  "questions": [
    {
      "question": "Markets are enabled. Would you like to generate and run Playwright e2e tests to verify everything works?",
      "header": "E2E tests",
      "options": [
        {
          "label": "Yes, generate and run tests (Recommended)",
          "description": "Creates e2e/markets.spec.ts with locale routing, currency, hreflang, and sitemap tests, then runs them"
        },
        {
          "label": "Generate tests only",
          "description": "Creates the test file but doesn't run it yet"
        },
        {
          "label": "Skip tests",
          "description": "Markets are enabled — skip e2e verification for now"
        }
      ],
      "multiSelect": false
    }
  ]
}
```

## Step 3: Generate and Run Tests

**If the user chose "Yes, generate and run tests":**

1. Execute the `generate-markets-e2e` skill from this plugin's `skills/generate-markets-e2e/SKILL.md`
2. After generation completes, run:
   ```bash
   bunx playwright test e2e/markets.spec.ts
   ```
3. Report the results. If any tests fail, analyze the failures and suggest specific fixes based on the test output.

**If the user chose "Generate tests only":**

1. Execute the `generate-markets-e2e` skill from this plugin's `skills/generate-markets-e2e/SKILL.md`
2. Tell the user the test file is ready and how to run it:
   ```
   Run: bunx playwright test e2e/markets.spec.ts
   ```

**If the user chose "Skip tests":**

Confirm markets are enabled and remind them they can run `/vercel-shop:verify-markets` later to generate and run tests.
