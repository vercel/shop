# videos

Remotion compositions that repurpose the docs homepage demos
(`apps/docs/app/[lang]/(home)/components/`) as 1920×1080 videos for social
posts and the blog. The demos' `setTimeout` state machines are ported to
frame-driven timelines; visuals and Geist tokens match the homepage.

Not part of the deploy pipeline — no `build`/`dev` scripts, so Turbo skips it.

## Compositions

| ID                   | Use                                              |
| -------------------- | ------------------------------------------------ |
| `Showreel`           | Blog hero: title card → all demos → end card     |
| `Cart`               | Tweet: add-to-cart choreography                  |
| `AgentMarkets`       | Tweet: `/vercel-shop:enable-shopify-markets`     |
| `AgentAuth`          | Tweet: `/vercel-shop:enable-shopify-auth`        |
| `AgentCMS`           | Tweet: `/vercel-shop:enable-shopify-cms`         |
| `ContentNegotiation` | Tweet: curl → Markdown product page              |
| `Assistant`          | Tweet: AI shopping assistant                     |

Kicker/title copy on every composition is a prop — tweak it in the studio
sidebar without touching code. `Stage` also takes `theme="dark"`.

Every demo composition has a `layout` prop:

- `"split"` (default) — OG-image style: kicker + headline on the left,
  demo card large on the right.
- `"full"` — no text, demo card maximized. Best when the tweet copy does
  the talking: `remotion render Cart out/cart.mp4 --props='{"layout":"full"}'`

## Usage

```sh
pnpm --filter videos studio        # preview & tweak
pnpm --filter videos render Cart out/cart.mp4
pnpm --filter videos render:all    # everything into out/
```
