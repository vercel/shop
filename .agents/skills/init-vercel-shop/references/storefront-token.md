# Connect an existing Shopify store

Use the installed Shopify AI Toolkit and Shopify CLI. The template sends `X-Shopify-Storefront-Access-Token`, so it needs a public Storefront access token, not Shopify CLI's Admin token or a Headless private token.

## Authenticate

1. Normalize the supplied URL to `<handle>.myshopify.com`.
2. Check `shopify version`. If `shopify store auth` or `shopify store execute` is unavailable, upgrade Shopify CLI before continuing.
3. Validate the Admin GraphQL operation with the Shopify toolkit, then authenticate with the exact scopes it reports: `shopify store auth --store <handle>.myshopify.com --scopes <required-scopes>`.

## Reuse or create a token

Query the shop ID, name, description, and existing public tokens with `shopify store execute --store <handle>.myshopify.com --query '...'`:

```graphql
query VercelShopStorefrontTokens {
  shop {
    description
    id
    name
    storefrontAccessTokens(first: 100) {
      nodes {
        accessToken
        title
      }
    }
  }
}
```

Prefer an existing token titled `Vercel Shop`. If none exists, validate and run this mutation with `shopify store execute --allow-mutations`, passing `{ "input": { "title": "Vercel Shop" } }` through `--variables`:

```graphql
mutation VercelShopStorefrontTokenCreate($input: StorefrontAccessTokenInput!) {
  storefrontAccessTokenCreate(input: $input) {
    storefrontAccessToken {
      accessToken
      title
    }
    userErrors {
      field
      message
    }
  }
}
```

Do not print the token in the final response. Write these values to `.env.local`:

- `NEXT_PUBLIC_SHOPIFY_SHOP_ID`: numeric part of `shop.id` (`gid://shopify/Shop/123456789` becomes `123456789`)
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`: normalized `.myshopify.com` domain
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`: reused or created public token

The storefront display name and description are not environment variables. If `shop.name` differs from the default, set it as the `site.name` literal in `lib/config/index.ts`; if `shop.description` is set, use it as the `site.description` literal.

## Fallback

The authenticated connector might not be allowed to read or create Storefront tokens. If Shopify returns `ACCESS_DENIED`, reports that the app is not extendable, or lacks the required unauthenticated scopes:

1. Direct the user to **Shopify admin → Settings → Apps and sales channels → Headless** to create or select a storefront, and copy its public Storefront API token into `.env.local` as `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
2. If `shop.id` was not read, have them set `NEXT_PUBLIC_SHOPIFY_SHOP_ID` to the number in the store's customer accounts URL, `https://shopify.com/<shop-id>/account`.
3. Never ask them to paste the token into chat.
