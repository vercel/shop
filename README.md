# Vercel Shop

A Next.js storefront template and reference architecture for Shopify, built with Next.js 16, React 19, Tailwind CSS 4, and the Shopify Storefront API.

See [shop.vercel.dev](https://shop.vercel.dev) for full documentation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fshop&project-name=shop&repository-name=shop&root-directory=apps/template&demo-title=Vercel+Shop&demo-url=https%3A%2F%2Fshop-template.vercel.app)

## Getting Started

Scaffold a new project using the CLI:

```sh
npx create-vercel-shop
```

Then add your Shopify credentials:

```sh
cp .env.example .env.local
```

```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
```

Start the development server:

```sh
npm run dev
```

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
| `add-megamenu` | Shopify menu-powered mega navigation |
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
| `apps/docs` | Documentation site at [shop.vercel.dev](https://shop.vercel.dev) |
| `apps/cli` | `create-vercel-shop` scaffolding CLI |

## Documentation

Full documentation is available at [shop.vercel.dev](https://shop.vercel.dev).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
