# Vercel Shop

Agent-ready commerce, powered by Shopify, Next, and Eve.

- **Shopify owns commerce.** Catalog, cart, checkout, customer accounts, predictive search, and policies come from Shopify through the framework-agnostic Hydrogen SDK (not the Hydrogen React Router framework).
- **Next.js owns the app.** Routing, Server Components, caching and invalidation, metadata, and the storefront's machine-readable surface for answer engines: Markdown representations, `/llms.txt`, structured data, and the sitemap.
- **Eve owns the agent.** Shop Agent's sessions, tools, and connections; its tools call Shopify directly.

See [vercel.shop](https://vercel.shop) for full documentation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fshop&project-name=shop&repository-name=shop&root-directory=apps%2Ftemplate&demo-title=Vercel+Shop&demo-url=https%3A%2F%2Fshop-template.vercel.app&env=NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN%2CNEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN&envDescription=Required%20Shopify%20Storefront%20API%20credentials&envLink=https%3A%2F%2Fvercel.shop%2Fdocs%2Freference%2Fenv-vars)

Vercel prompts for the two required Shopify credentials before the first deployment.

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

2. In Shopify admin, create a storefront token in **Settings → Apps and sales channels → Headless**, enable the required Storefront API permissions, then add your Shopify credentials:

```sh
cp .env.example .env.local
```

```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
```

3. Start the development server with the same package manager you used to scaffold the project:

```sh
pnpm dev
npm run dev
yarn dev
bun dev
```

See [vercel.shop/docs/getting-started](https://vercel.shop/docs/getting-started) for the full setup guide and [Storefront API Permissions](https://vercel.shop/docs/reference/storefront-api-permissions) for the complete scope reference.

## Features

Shopify

- Product, collection, search, blog, page, and policy content from the Storefront API with validated, typed GraphQL
- Optimistic cart with Hydrogen forms, shared cart state, and server handlers
- Customer accounts through the Customer Account API, opt-in
- Shopify analytics, consent, and WebMCP tool registration, opt-in

Next.js

- Next.js 16 App Router, React 19, React Compiler, Tailwind CSS 4, shadcn/ui
- Partial prerendering with tagged caches invalidated by Shopify webhooks
- Markdown representations, `/llms.txt`, Schema.org data, sitemap, and robots for answer engines
- Single-locale storefront by default; skills add next-intl and Shopify Markets

Eve

- Shop Agent for product discovery, store questions, and cart updates in a side drawer, opt-in
- Shopify catalog and policy MCP connections plus Hydrogen cart handlers

Customer authentication is disabled by default. Follow the [authentication guide](https://vercel.shop/docs/anatomy/authentication) to configure Shopify credentials and callback URLs before enabling `auth.isEnabled` in `lib/config/index.ts`.

Shop Agent is disabled by default. Set `agent.isEnabled` to `true` in `lib/config/index.ts` and follow the [Shop Agent guide](https://vercel.shop/docs/anatomy/agent) to configure AI Gateway access and review privacy and spending safeguards before enabling public chat.

## Skills

Vercel Shop includes a `vercel-shop` plugin with skills for extending the storefront with common commerce patterns. In Claude Code, these are exposed as `/vercel-shop:<skill>` commands:

| Skill                       | Description                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| `build-shop`                | Build or adapt storefront routes with Vercel Shop patterns                 |
| `shopify-graphql-reference` | Add Shopify-validated GraphQL operations in the template's layout          |
| `enable-analytics`          | Add Vercel Analytics, Speed Insights, and Google Tag Manager               |
| `enable-i18n`               | Locale-prefixed URL routing + next-intl message catalogs (no Markets)      |
| `enable-shopify-markets`    | Multi-locale support with Shopify Markets and next-intl                    |
| `enable-shopify-menus`      | Replace hardcoded nav/footer with Shopify-powered menus, optional megamenu |
| `update-shop`               | Keep a storefront current with template changes                            |

## Documentation

Full documentation is available at [vercel.shop](https://vercel.shop).

## License

MIT
