# Vercel Shop

A Next.js storefront template and reference architecture for Shopify, built with Next.js 16, React 19, Tailwind CSS 4, and the Shopify Storefront API.

See [vercel.shop](https://vercel.shop) for full documentation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fshop&project-name=shop&repository-name=shop&root-directory=apps%2Ftemplate&demo-title=Vercel+Shop&demo-url=https%3A%2F%2Fshop-template.vercel.app&env=NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN%2CNEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN&envDescription=Required%20Shopify%20Storefront%20API%20credentials&envLink=https%3A%2F%2Fvercel.shop%2Fdocs%2Freference%2Fenv-vars)

Vercel prompts for the two required Shopify credentials before the first deployment.

## Getting Started

1. Scaffold a new project using the CLI:

```sh
npx create-vercel-shop@latest my-store
```

The scaffold also inlines the Vercel Shop agent skills into `.agents/skills/` (with Claude Code links in `.claude/skills/` and commands in `.claude/commands/`), so they are versioned with your project. To add only the agent skills to an existing project, run this from that project's root:

```sh
npx create-vercel-shop@latest --no-template
```

Two optional companion plugins are recommended for agents that support them:

```sh
npx plugins add vercel/vercel-plugin --scope project --yes
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
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

- **Next.js 16 App Router** with React 19 and React Compiler
- **Shopify Storefront API** via GraphQL with type-safe operations
- **Customer authentication** with Hydrogen and Shopify Customer Account API OIDC — opt-in via `lib/config.ts`
- **Tailwind CSS 4** and shadcn/ui components
- **Internationalization-ready** with next-intl
- **AI-ready** with Vercel AI SDK integration
- **Optimized cart** with server actions and instant cache invalidation
- **SEO** with structured data and dynamic metadata

## Skills

Vercel Shop inlines agent skills for extending the storefront with common commerce patterns. They live in `.agents/skills/` and are picked up automatically by agents that support skills (Claude Code reads them via `.claude/skills/`):

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
