# Collection and Search Route Architecture

## Preserve the static header

Collection identity, title, description, and other cacheable header content belong in the static shell. The route intentionally resolves the collection before rendering and keeps `searchParams` unawaited for filters, sort, pagination, and results.

Do not move the collection header into the results boundary. Do not change `getCollection` from plain `"use cache"` to remote caching without re-evaluating shell coherence.

Search is different: its query and results are request inputs. The search route may use runtime prefetching because a prefetched query can materially improve the destination. Preserve its `instant` and `prefetch` pairing unless production request volume or navigation evidence justifies a change.

## Results and controls

- Derive search state once and share its promise with results, facets, counts, and controls.
- Run result and facet queries concurrently when neither depends on the other.
- Use separate boundaries when toolbar, facets, and results can become useful independently.
- Keep the grid server-rendered. Isolate URL updates, pending state, drawers, and infinite-scroll observation in client leaves.
- Preserve the current results while a filter transition is pending when possible; avoid blanking the entire route.
- Keep skeleton cards dimensionally identical to real cards at every breakpoint.

## Images and pagination

- Provide product-card `sizes` that match the actual column count at each breakpoint.
- Keep grid images lazy by default. A dense grid magnifies every eager-loading or prefetch decision.
- Bound the initial query and payload. Fetch later pages only when requested or near the viewport.
- Deduplicate appended products and stop observers when `hasNextPage` is false.

## Prefetch traffic

Product grids are high fanout. Do not add `prefetch={true}` to every card by reflex. Compare navigation latency against the number and cost of prefetch requests in a production build. Shell-only prefetching is the safe default when dozens of product links are visible.
