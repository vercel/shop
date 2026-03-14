---
name: generate-markets-e2e
description: >
  Generate Playwright e2e tests that verify Shopify Markets multi-locale setup.
  Reads the project's actual locale config and generates context-aware tests.
user-invocable: false
---

# Generate Markets E2E Tests

This skill reads the project's locale configuration and generates a comprehensive Playwright test suite that verifies the Shopify Markets setup end-to-end.

## Phase 1: Read Config

Read the following files to extract the markets configuration:

### 1a. Locale Config — `lib/i18n.ts`

Extract:
- `enabledLocales` array — the active locales
- `defaultLocale` — the default locale
- `localeCurrency` map — currency code and symbol per locale

### 1b. Routing Config — `lib/i18n/routing.ts`

Extract:
- `localePrefix` mode — `"as-needed"`, `"always"`, or object with `mode` + `prefixes`
- `domains` config (if per-domain routing)
- Custom prefix mappings (if short prefixes like `/en` instead of `/en-US`)

If this file doesn't exist, assume sub-path routing with `localePrefix: "as-needed"` and full locale codes as prefixes.

### 1c. Locale Switcher — `components/layout/nav/locale-currency.tsx`

Note the UI structure for writing selector tests:
- The trigger contains the country code and currency display
- The dropdown uses `SelectPanel` / `SelectPanelContent` / `SelectPanelItem` components
- Locale options render with `CountryFlag` + locale label text (e.g., "English - US")
- The component only renders the interactive selector when `localeSwitchingEnabled` is true

## Phase 2: Install Playwright (if needed)

### 2a. Check for existing Playwright setup

Check if `@playwright/test` is already in `package.json` devDependencies and if `playwright.config.ts` exists.

### 2b. Install if missing

If `@playwright/test` is not installed:

```bash
bun add -d @playwright/test
```

### 2c. Create `playwright.config.ts` (if it doesn't exist)

Write the following config. Do NOT overwrite an existing config.

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2d. Install browser

```bash
bunx playwright install chromium
```

## Phase 3: Generate `e2e/markets.spec.ts`

Create the `e2e/` directory if it doesn't exist, then generate the test file.

**IMPORTANT:** The test file must be generated dynamically based on the actual config values read in Phase 1. Embed the config values as constants at the top of the file so tests are self-contained and debuggable.

Use the following template, replacing placeholders with actual values from the config:

```ts
import { test, expect } from "@playwright/test";

// ── Config (generated from lib/i18n.ts and lib/i18n/routing.ts) ──────────

const ENABLED_LOCALES = {{ENABLED_LOCALES_ARRAY}};
const DEFAULT_LOCALE = "{{DEFAULT_LOCALE}}";
const LOCALE_PREFIX_MODE = "{{LOCALE_PREFIX_MODE}}"; // "as-needed" | "always"
const LOCALE_CURRENCY: Record<string, { currency: string; symbol: string }> = {{LOCALE_CURRENCY_MAP}};
const LOCALE_PREFIXES: Record<string, string> = {{LOCALE_PREFIXES_MAP}};

// Helpers
function prefixFor(locale: string): string {
  return LOCALE_PREFIXES[locale] ?? `/${locale}`;
}

function isDefaultLocale(locale: string): boolean {
  return locale === DEFAULT_LOCALE;
}

function expectedPath(locale: string, path: string): string {
  if (LOCALE_PREFIX_MODE === "as-needed" && isDefaultLocale(locale)) {
    return path;
  }
  const prefix = prefixFor(locale);
  return path === "/" ? prefix : `${prefix}${path}`;
}

// ── Test Suites ──────────────────────────────────────────────────────────

test.describe("Locale URL routing", () => {
  for (const locale of ENABLED_LOCALES) {
    test(`${locale} — homepage loads`, async ({ page }) => {
      const path = expectedPath(locale, "/");
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/404/);
      await expect(page.locator("body")).toBeVisible();
    });

    test(`${locale} — products page loads`, async ({ page }) => {
      const path = expectedPath(locale, "/search");
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/404/);
    });
  }

  if (LOCALE_PREFIX_MODE === "as-needed") {
    test("default locale serves without prefix", async ({ page }) => {
      await page.goto("/");
      await expect(page).not.toHaveURL(new RegExp(`^/${DEFAULT_LOCALE}`));
      await expect(page.locator("body")).toBeVisible();
    });
  }

  if (LOCALE_PREFIX_MODE === "always") {
    test("root URL redirects to default locale prefix", async ({ page }) => {
      await page.goto("/");
      const prefix = prefixFor(DEFAULT_LOCALE);
      await expect(page).toHaveURL(new RegExp(`^${prefix}`));
    });
  }
});

test.describe("Locale switcher", () => {
  test("locale selector is visible in navigation", async ({ page }) => {
    await page.goto("/");
    // The selector trigger shows the country code and currency
    const trigger = page.locator("[data-slot='select-panel-trigger']").first();
    await expect(trigger).toBeVisible();
  });

  for (const locale of ENABLED_LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
    test(`switch to ${locale} updates URL`, async ({ page }) => {
      await page.goto("/");

      // Open the locale selector
      const trigger = page.locator("[data-slot='select-panel-trigger']").first();
      await trigger.click();

      // Find and click the target locale option
      const panel = page.locator("[data-slot='select-panel-content']");
      await expect(panel).toBeVisible();

      // Locale options display the label from getLocaleData (e.g., "English - US", "Deutsch - DE")
      const localeItem = panel.locator("[data-slot='select-panel-item']").filter({
        hasText: locale.split("-")[1],
      });
      await localeItem.first().click();

      // URL should update to include the locale prefix
      const prefix = prefixFor(locale);
      await expect(page).toHaveURL(new RegExp(prefix), { timeout: 10000 });
    });
  }
});

test.describe("Currency display", () => {
  for (const locale of ENABLED_LOCALES) {
    test(`${locale} — prices show ${LOCALE_CURRENCY[locale]?.currency ?? "correct"} currency`, async ({ page }) => {
      const path = expectedPath(locale, "/search");
      await page.goto(path);

      // Look for price elements — the storefront renders prices with currency symbols
      const priceElement = page.locator("[data-slot='price']").first();

      // If products exist, verify currency symbol
      const count = await priceElement.count();
      if (count > 0) {
        const text = await priceElement.textContent();
        const expected = LOCALE_CURRENCY[locale];
        if (expected) {
          expect(text).toContain(expected.symbol);
        }
      }
    });
  }
});

test.describe("Cart per locale", () => {
  for (const locale of ENABLED_LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
    test(`${locale} — cart reflects locale currency`, async ({ page }) => {
      const path = expectedPath(locale, "/search");
      await page.goto(path);

      // Find a product link and navigate to it
      const productLink = page.locator('a[href*="/products/"]').first();
      const count = await productLink.count();
      if (count === 0) {
        test.skip();
        return;
      }

      await productLink.click();
      await page.waitForLoadState("networkidle");

      // Add to cart (the add-to-cart button)
      const addToCart = page.getByRole("button", { name: /add to cart/i });
      const addCount = await addToCart.count();
      if (addCount === 0) {
        test.skip();
        return;
      }

      await addToCart.click();

      // Open cart overlay
      const cartButton = page.locator("[data-slot='cart-button']").first();
      if ((await cartButton.count()) > 0) {
        await cartButton.click();
      }

      // Verify the cart shows the correct currency
      const expected = LOCALE_CURRENCY[locale];
      if (expected) {
        const cartContent = page.locator("[data-slot='cart-overlay']").first();
        if ((await cartContent.count()) > 0) {
          await expect(cartContent).toContainText(expected.symbol, { timeout: 5000 });
        }
      }
    });
  }
});

test.describe("Hreflang tags", () => {
  test("homepage has hreflang alternates for all enabled locales", async ({ page }) => {
    await page.goto("/");

    for (const locale of ENABLED_LOCALES) {
      const hreflang = page.locator(`link[rel="alternate"][hreflang="${locale}"]`);
      await expect(hreflang).toBeAttached();
    }

    // x-default should also be present
    const xDefault = page.locator('link[rel="alternate"][hreflang="x-default"]');
    await expect(xDefault).toBeAttached();
  });

  test("hreflang URLs contain correct locale prefixes", async ({ page }) => {
    await page.goto("/");

    for (const locale of ENABLED_LOCALES) {
      const hreflang = page.locator(`link[rel="alternate"][hreflang="${locale}"]`);
      const href = await hreflang.getAttribute("href");
      expect(href).toBeTruthy();

      const prefix = prefixFor(locale);
      if (LOCALE_PREFIX_MODE === "as-needed" && isDefaultLocale(locale)) {
        // Default locale href should not have a locale prefix (or just be "/")
        expect(href).not.toContain(`${prefix}/`);
      } else {
        expect(href).toContain(prefix);
      }
    }
  });
});

test.describe("Sitemap", () => {
  test("sitemap contains locale-specific URLs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();

    const body = await response.text();

    // Sitemap should contain URLs for each enabled locale
    for (const locale of ENABLED_LOCALES) {
      if (LOCALE_PREFIX_MODE === "as-needed" && isDefaultLocale(locale)) {
        // Default locale URLs may not have prefix
        continue;
      }
      const prefix = prefixFor(locale);
      expect(body).toContain(prefix);
    }
  });
});
```

### Template variable replacement

When generating the file, replace the placeholders:

- `{{ENABLED_LOCALES_ARRAY}}` → JSON array from `enabledLocales`, e.g., `["en-US", "de-DE", "fr-FR"]`
- `{{DEFAULT_LOCALE}}` → value of `defaultLocale`, e.g., `en-US`
- `{{LOCALE_PREFIX_MODE}}` → the `localePrefix` mode from routing config: `"as-needed"` or `"always"`
- `{{LOCALE_CURRENCY_MAP}}` → JSON object from `localeCurrency`, filtered to only enabled locales
- `{{LOCALE_PREFIXES_MAP}}` → mapping of locale to URL prefix. If custom prefixes (short codes) are configured in routing.ts, use those. Otherwise, map each locale to `/${locale}` (e.g., `{ "en-US": "/en-US", "de-DE": "/de-DE" }`)

### Selectors note

The generated tests use `data-slot` attribute selectors which are the standard pattern in this codebase's `ui/` components:
- `[data-slot='select-panel-trigger']` — the locale/currency selector trigger
- `[data-slot='select-panel-content']` — the dropdown panel
- `[data-slot='select-panel-item']` — individual selectable items
- `[data-slot='price']` — price display elements
- `[data-slot='cart-button']` — the cart icon/button
- `[data-slot='cart-overlay']` — the cart overlay panel

If any of these selectors don't match elements in the current codebase, check the actual component markup and adjust the selectors accordingly. Look at the component source files to find the correct `data-slot` values or fall back to role-based selectors.
