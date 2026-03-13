# Recipe: Customer Account API

> Customer operations (profile, orders, addresses) use Shopify's Customer Account API with OAuth, separate from the Storefront API.

## When to read this

- Modifying customer profile, orders, or address pages
- Debugging authentication or session issues
- Adding new customer-facing features (wishlists, preferences)

## Key files

| File | Role |
|------|------|
| `lib/shopify/operations/customer.ts` | All customer GraphQL operations (1300+ lines) |
| `lib/shopify/types/customer.ts` | Customer Account API types (Customer, Address, Order, etc.) |
| `lib/auth/auth.ts` | better-auth setup with Shopify OIDC provider |
| `lib/auth/client.ts` | Client-side auth utilities (`useSession`, `signIn`, `signOut`) |
| `lib/auth/server.ts` | Server-side auth utilities (`getSession`, `requireSession`) |
| `.claude/schemas/shopify-customer.graphql` | Customer Account API schema |

## How it works

### Two separate APIs

```
Storefront API (products, collections, cart)
  → Uses: X-Shopify-Storefront-Access-Token header
  → Client: lib/shopify/client.ts (shopifyFetch)
  → Public, no auth required

Customer Account API (profile, orders, addresses)
  → Uses: Bearer {accessToken} header
  → Client: Custom fetch in operations/customer.ts
  → Requires OAuth login
```

### Authentication flow

```
1. User clicks "Sign In"
2. signIn() → Shopify OIDC provider (via better-auth)
3. Shopify login page → OAuth callback
4. better-auth stores session with accessToken
5. Server: getSession() → { accessToken, user }
6. Operations: getCustomer(accessToken) → customer data
```

### Customer operations

The `operations/customer.ts` file provides:

- **Profile**: `getCustomer`, `updateCustomer`
- **Orders**: `getOrders` (paginated), `getOrder`
- **Addresses**: `getAddresses`, `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`
- **Preferences**: `getEmailPreferences`, `updateEmailPreferences`

Each operation takes `accessToken` as the first parameter:

```tsx
export async function getCustomer(accessToken: string) {
  // Custom fetch to Customer Account API endpoint
  // with Authorization: Bearer {accessToken}
}
```

### Session utilities

```tsx
// Server-side (lib/auth/server.ts)
const session = await getSession();          // Returns session or null
const session = await requireSession();       // Throws if not authenticated
const customerSession = await getCustomerSession(); // Returns customer-specific session

// Client-side (lib/auth/client.ts)
const { data: session } = useSession();       // React hook
await signIn("shopify");                      // Trigger login
await signOut();                              // Trigger logout
```

### Error handling

Customer operations use specific error classes for common failures (expired token, network errors). Failed operations typically redirect to login or show an error message.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Always reference `.claude/schemas/shopify-customer.graphql` for Customer Account API queries — the schema is different from the Storefront API
- [ ] GUARDRAIL: Customer operations require `accessToken` — never call them without checking authentication first (use `getSession()` or `requireSession()`)
- [ ] GUARDRAIL: Never expose customer access tokens to the client — all customer operations happen server-side

## Common modifications

### Adding a new customer feature

1. Check the Customer Account API schema (`.claude/schemas/shopify-customer.graphql`)
2. Add the GraphQL query/mutation in `lib/shopify/operations/customer.ts`
3. Add types in `lib/shopify/types/customer.ts` if needed
4. Create a server action that calls `requireSession()` then the operation
5. Build the UI component using the session data

## See also

- [GraphQL Operations](./graphql-operations.md) — Storefront API operations
- [Type Seams](../architecture/type-seams.md) — Customer types live in `lib/shopify/types/customer.ts`
