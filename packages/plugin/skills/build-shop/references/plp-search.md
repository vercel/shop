# Collection and Search Routes

## Reference implementation

- Docs: [PLP anatomy](https://vercel.shop/docs/anatomy/pages/plp), [route reference](https://vercel.shop/docs/reference/routes)
- Collection routes: `apps/template/app/collections/page.tsx`, `apps/template/app/collections/all/page.tsx`, `apps/template/app/collections/[handle]/page.tsx`
- Search route: `apps/template/app/search/page.tsx`
- Components: `apps/template/components/collections/`, `apps/template/components/product-card/product-card.tsx`
- Browse state and cache decisions: `apps/template/lib/collections/{index,server,action,types}.ts`, `apps/template/lib/search/server.ts`, `apps/template/lib/product/server.ts`
- Operations and transforms: `apps/template/lib/shopify/operations/collections/server.ts`, `apps/template/lib/shopify/operations/products/server.ts`, `apps/template/lib/shopify/transforms/collection/index.ts`, `apps/template/lib/shopify/transforms/filters/index.ts`
- Public source fallback: [collection routes source](https://github.com/vercel/shop/tree/main/apps/template/app/collections), [search route source](https://github.com/vercel/shop/blob/main/apps/template/app/search/page.tsx), [template source](https://github.com/vercel/shop/tree/main/apps/template)

## Preserve the static header

Collection identity, title, description, and other cacheable header content belong in the static shell. The route intentionally resolves the collection before rendering and keeps `searchParams` unawaited for filters, sort, pagination, and results.

Do not move the collection header into the results boundary. Do not change `getCollection` from plain `"use cache"` to remote caching without re-evaluating shell coherence.

Search is different: its query and results are request inputs. The search route may use runtime prefetching because a prefetched query can materially improve the destination. Preserve its `instant` and `prefetch` pairing unless production request volume or navigation evidence justifies a change.

## One browse store for collections and search

Collections and `/search` share the same Hydrogen collection store. `CollectionBrowseProvider` wraps `CollectionProvider` from `@shopify/hydrogen/react`; filters, sort, badges, and load-more all read from `useCollection()` and mutate through `useCollectionActions()`. Do not reintroduce a parallel `URLSearchParams`-driven path for search.

- URL vocabulary is Hydrogen's Liquid-compatible `filter.*` and `sort_by` (`price-descending`, `best-selling`). `resolveBrowseParams` in `lib/collections/server.ts` is the only place that turns a search string into Hydrogen's `ProductFilter[]` and `sort_by` value; routes (through `readBrowseState`) and the load-more server action call it. Selected state, badges, and facet pruning use Hydrogen's `isFilterInputActive`; there is no parallel `filter.*` record. Hydrogen folds the taxonomy metafield namespace into `key`, so the Shopify operations split it back out at the query boundary.
- Search mounts the store with `handle={\`search:${q}\`}` so a new term rebuilds state and drops stale filters. `q` and `collection` are not store-owned, so the reconciler preserves them across filter and sort changes.
- Search only sorts by relevance and price. Pass `SEARCH_SORT_EXCLUDE` to `CollectionsSortSelect`; no `sort_by` means `RELEVANCE`.
- Filter links and active-filter badges render real `href`s built with `serializeCollectionParams` and `getFilterRemovalUrl`, then `preventDefault` into the store action so no-JS navigation still works.
- Every browse route renders `BrowseResults` through the shared `Browse` component. Its `source` names the Storefront backend: collection products for `/collections/[handle]`, the search index for `/search` and `/collections/all`. Cursors are only valid for the backend that issued them.
- `InfiniteProductGrid` serializes the current store state into `search` on every load-more call. `loadMoreBrowseProductsAction` accepts `{ cursor, search, source }` rather than a frozen filter snapshot.

## Results and controls

- Derive search state once and share its promise with results, facets, counts, and controls.
- Run result and facet queries concurrently when neither depends on the other.
- Use separate boundaries when toolbar, facets, and results can become useful independently.
- Keep the grid server-rendered. Isolate URL updates, pending state, drawers, and infinite-scroll observation in client leaves.
- Keep the current results visible and dimmed while the browse store's `status` is `loading`; avoid blanking the grid or the route.
- Keep skeleton cards dimensionally identical to real cards at every breakpoint.

## Images and pagination

- Provide product-card `sizes` that match the actual column count at each breakpoint.
- Keep grid images lazy by default. A dense grid magnifies every eager-loading or prefetch decision.
- Bound the initial query and payload. Fetch later pages only when requested or near the viewport.
- Deduplicate appended products and stop observers when `hasNextPage` is false.

## Prefetch traffic

Product grids are high fanout. Do not add `prefetch={true}` to every card by reflex. Shell-only prefetching is the safe default when dozens of product links are visible. Compare navigation latency against request volume only when prefetch behavior is explicitly being investigated.
