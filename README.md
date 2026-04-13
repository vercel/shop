# Vercel Shop

A Next.js storefront template and reference architecture for Shopify, built with Next.js 16, React 19, Tailwind CSS 4, and the Shopify Storefront API.

See [docs.vercel.shop](https://docs.vercel.shop) for full documentation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fshop&project-name=shop&repository-name=shop&root-directory=apps/template&demo-title=Vercel+Shop&demo-url=https%3A%2F%2Fshop-template.vercel.app)

## Getting Started

1. Scaffold a new project using the CLI:

```sh
npx create-vercel-shop@latest
```

`create-vercel-shop` also attempts to add the recommended agent plugins after scaffolding:

```sh
npx plugins add vercel/vercel-plugin
npx plugins add shopify/shopify-ai-toolkit
```

2. In Shopify admin, create a storefront token in **Settings → Apps and sales channels → Headless**, enable the required Storefront API permissions, then add your Shopify credentials:

```sh
cp .env.example .env.local
```

```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
NEXT_PUBLIC_SITE_NAME="Your Store Name"
```

3. Start the development server with the same package manager you used to scaffold the project:

```sh
pnpm dev
npm run dev
yarn dev
bun dev
```

See [docs.vercel.shop/docs/getting-started](https://docs.vercel.shop/docs/getting-started) for the full setup guide and [Storefront API Permissions](https://docs.vercel.shop/docs/reference/storefront-api-permissions) for the complete scope reference.

## Features

- **Next.js 16 App Router** with React 19 and React Compiler
- **Shopify Storefront API** via GraphQL with type-safe operations
- **Tailwind CSS 4** and shadcn/ui components
- **Internationalization-ready** with next-intl
- **AI-ready** with Vercel AI SDK integration
- **Optimized cart** with server actions and instant cache invalidation
- **SEO** with structured data and dynamic metadata

## Skills

Vercel Shop includes a skill system for extending the storefront with common commerce patterns:

| Skill | Description |
|-------|-------------|
| `enable-shopify-menus` | Replace hardcoded nav/footer with Shopify menus, optional megamenu |
| `enable-shopify-cms` | Use Shopify metaobjects as a CMS |
| `enable-content-negotiation` | Serve product pages as markdown to LLM agents |
| `add-locale-url-prefix` | Locale-prefixed URL routing |
| `enable-shopify-auth` | Customer authentication with Shopify OIDC |
| `enable-shopify-markets` | Multi-locale support with Shopify Markets |

## Project Structure

This is a monorepo managed with [Turborepo](https://turbo.build/) and pnpm.

| App | Description |
|-----|-------------|
| `apps/template` | The Next.js storefront template |
| `apps/docs` | Documentation site at [docs.vercel.shop](https://docs.vercel.shop) |
| `apps/cli` | `create-vercel-shop` scaffolding CLI |

## Documentation

Full documentation is available at [docs.vercel.shop](https://docs.vercel.shop).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
