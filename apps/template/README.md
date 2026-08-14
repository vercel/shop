# Vercel Shop

A Next.js storefront template and reference architecture for Shopify, built with Next.js 16, React 19, Tailwind CSS 4, and the Shopify Storefront API.

See [vercel.shop](https://vercel.shop) for full documentation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fshop&project-name=shop&repository-name=shop&root-directory=apps%2Ftemplate&demo-title=Vercel+Shop&demo-url=https%3A%2F%2Fshop-template.vercel.app)

## Getting Started

1. Scaffold a new project using the CLI:

```sh
npx create-vercel-shop@latest my-store
```

The scaffold also installs these project-scoped agent plugins:

- `vercel-shop`
- `vercel-plugin`
- `shopify-ai-toolkit`

To install only the agent plugins into an existing project, run this from that project's root:

```sh
npx create-vercel-shop@latest --no-template
```

2. Start the development server with the same package manager you used to scaffold the project:

```sh
pnpm dev
npm run dev
yarn dev
bun dev
```

See [vercel.shop/docs/getting-started](https://vercel.shop/docs/getting-started) for the full setup guide and [Storefront API Permissions](https://vercel.shop/docs/reference/storefront-api-permissions) for the complete scope reference.

## Features

- **Next.js 16 App Router** with React 19 and React Compiler
- **Shopify Storefront API** via GraphQL with type-safe operations
- **Customer authentication** with Hydrogen and Shopify Customer Account API OIDC — opt-in via `lib/config.ts`
- **Tailwind CSS 4** and shadcn/ui components
- **Internationalization-ready** with next-intl
- **AI-ready** with Vercel AI SDK integration
- **Experimental WebMCP tools** for browser agents
- **Optimized cart** with server actions and instant cache invalidation
- **SEO** with structured data and dynamic metadata

## Experimental WebMCP tools

[WebMCP](https://developer.chrome.com/docs/ai/webmcp) is a proposed browser API for exposing structured page tools to AI agents. This template progressively registers four tools when `document.modelContext` is available; unsupported browsers continue to get the normal storefront.

| Tool                       | Capability                                      |
| -------------------------- | ----------------------------------------------- |
| `shop.search_products`     | Search the public product catalog               |
| `shop.get_product_options` | Read product option names and values            |
| `shop.get_cart`            | Read a reduced view of the browser's guest cart |
| `shop.add_to_cart`         | Add one product variant and open the cart       |

The example keeps the integration explicit: `components/webmcp-tools.tsx` contains the JSON Schemas, direct `registerTool()` calls, and `AbortSignal` cleanup. `lib/webmcp/action.ts` validates every input again on the server. Cart writes reuse the existing `/api/cart` path, including BotID checks when enabled, and tool results omit cart IDs, checkout URLs, payment data, and customer data.

### Test locally in Chrome

WebMCP is experimental. Use Chrome 150 or newer for local testing:

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable **WebMCP for testing**, then relaunch Chrome.
3. Install the [WebMCP – Model Context Tool Inspector](https://chromewebstore.google.com/detail/webmcp-model-context-tool/gbpdfapgefenggkahomfgkhfehlcenpd).
4. Open the storefront and use the extension's side panel to inspect or manually execute the registered tools. For natural-language testing, select **Set Gemini API key** in the side panel first.

The inspector is a development tool and does not provide production security boundaries. Only use it on pages you trust.

To drive the same tools from Codex or another coding agent, connect [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) to the flag-enabled browser and enable its experimental WebMCP category. In that Chrome profile, open `chrome://inspect/#remote-debugging`, enable remote debugging, and keep Chrome open. Then, for Codex:

```sh
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest --auto-connect --category-experimental-webmcp=true
```

Remote debugging gives the connected agent access to the browser. Use a dedicated Chrome profile without sensitive tabs or personal data.

For a public deployment during Chrome's origin trial, create a token for that exact origin. Origin-trial tokens are origin-bound and expire. A token from the canonical demo does not enable WebMCP on cloned deployments.

## Skills

Vercel Shop includes a `vercel-shop` plugin with skills for extending the storefront with common commerce patterns. In Claude Code, these are exposed as `/vercel-shop:<skill>` commands:

| Skill                    | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `build-shop`             | Build or adapt storefront routes with Vercel Shop patterns                 |
| `enable-i18n`            | Locale-prefixed URL routing + next-intl message catalogs (no Markets)      |
| `enable-analytics`       | Add Vercel Analytics, Speed Insights, and Google Tag Manager               |
| `enable-shopify-markets` | Multi-locale support with Shopify Markets and next-intl                    |
| `enable-shopify-menus`   | Replace hardcoded nav/footer with Shopify-powered menus, optional megamenu |

## Documentation

Full documentation is available at [vercel.shop](https://vercel.shop).

## License

MIT
