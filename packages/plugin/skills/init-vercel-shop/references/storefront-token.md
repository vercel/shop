# Connect an existing Shopify store

Use the installed Shopify AI Toolkit and Shopify CLI. The template sends `X-Shopify-Storefront-Access-Token`, so it needs a public Storefront access token, not Shopify CLI's Admin token or a Headless private token.

## Authenticate

1. Normalize the supplied URL to `<handle>.myshopify.com`.
2. Check `shopify version`. If `shopify store auth` or `shopify store execute` is unavailable, upgrade Shopify CLI before continuing.
3. Validate the Admin GraphQL operation with the Shopify toolkit and use the exact required scopes it reports.
4. Authenticate with `shopify store auth --store <handle>.myshopify.com --scopes <required-scopes>`.

## Reuse or create a token

First query the shop name and existing public tokens with `shopify store execute --store <handle>.myshopify.com --query '...'`:

```graphql
query VercelShopStorefrontTokens {
  shop {
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

Prefer an existing token titled `Vercel Shop`. If none exists, validate and run this mutation with `shopify store execute`, including `--allow-mutations`:

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

Pass `{ "input": { "title": "Vercel Shop" } }` through `--variables`.

Do not print the token in the final response. Write these values to `.env.local`:

- `SHOPIFY_STORE_DOMAIN`: normalized `.myshopify.com` domain
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: reused or created public token
- `NEXT_PUBLIC_SITE_NAME`: `shop.name`

## Fallback

The authenticated connector might not be allowed to read or create Storefront tokens. If Shopify returns `ACCESS_DENIED`, reports that the app is not extendable, or lacks the required unauthenticated scopes:

1. Direct the user to **Shopify admin → Sales channels → Headless**.
2. Ask them to create or select a storefront and copy its public Storefront API token directly into `.env.local` as `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
3. Never ask them to paste the token into chat.
