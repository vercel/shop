# Vercel Shop Monorepo

Monorepo for the [Vercel Shop](https://vercel.shop) storefront template and supporting tooling.

| Path            | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `apps/template` | The Next.js storefront template — see its [README](apps/template/README.md) |
| `skills`        | Agent skills for setting up and extending Vercel Shop storefronts           |

Built with [Turborepo](https://turbo.build/) and pnpm.

Install the Shop skills in your project:

```sh
npx skills add vercel/shop --skill '*' --yes
```

## License

MIT
