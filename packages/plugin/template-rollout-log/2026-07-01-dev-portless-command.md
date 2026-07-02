---
title: Add a dev:portless script for HTTPS local dev at shop.localhost
changeKey: dev-portless-command
introducedOn: 2026-07-01
changeType: enhancement
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/package.json
---

## Summary

Added a `dev:portless` script that runs the Next dev server behind [portless](https://portless.sh), a local reverse proxy that serves the app over HTTPS/HTTP2 at a `*.localhost` domain with a trusted local CA. The script mirrors `dev` (`graphql-codegen || true && …`) and wraps `next dev` with `portless shop`, where `shop` is the app name that becomes the subdomain. The store runs at a clean **`https://shop.localhost`** (no port).

portless is intentionally **not** a project dependency — the script resolves against a globally installed `portless` (`npm install -g portless`, Node ≥24). This keeps a machine-level dev tool out of the storefront's dependency tree and lockfile. The install-and-run steps are documented in the getting-started docs (`apps/docs/content/docs/getting-started/index.mdx`, "Run over HTTPS at a custom domain").

The proxy listens on the default HTTPS port 443 deliberately: a portless URL is only port-free when the proxy owns 443, since browsers omit the port only when it matches the scheme default. No `next.config.ts` change is needed — Next 16 already allows `**.localhost` cross-origin dev requests by default (matched on hostname), so the `shop` subdomain is permitted out of the box.

The previous `dev:https` script (`next dev --experimental-https`) was removed in the same change: portless supersedes it, giving trusted certs and a stable hostname instead of a self-signed cert on `https://localhost:3000`.

## Why it matters

Some workflows need a real HTTPS origin locally — Shopify OAuth/Customer Account callbacks, `Secure` cookies, better-auth trusted origins, and OG/absolute-URL testing all behave differently over `http://localhost:3000`. portless gives a stable, trusted `https://shop.localhost` without `next dev --experimental-https`'s self-signed-cert friction, and a memorable hostname across restarts (no shifting ports).

## Note: port 443 needs one-time elevation

portless runs a single shared proxy daemon for all `*.localhost` apps. Binding 443 requires elevation, so the first start prompts for `sudo` once; the daemon then stays up and later `dev:portless` runs just attach to it — no repeated prompts. To avoid the prompt entirely, run `portless service install` once to start the proxy on 443 at OS startup. The daemon persists its port in `~/.portless/proxy.port`; if it was ever started on a non-default port, `portless proxy stop` clears that file so the next start falls back to 443.

## Apply when

- The storefront wants a trusted, port-free HTTPS local origin, especially when exercising auth callbacks or secure-cookie flows.

## Adopt with changes

- Rename `shop` in the script to the store's own name (e.g. `acme` → `https://acme.localhost`), or drop the name arg and let portless infer it from `package.json`.

## Safe to skip when

- The storefront is happy with plain `pnpm dev` (HTTP), or standardizes on a different local-proxy tool. The script is inert without a global `portless` on the PATH, so leaving it in place is harmless even if unused. If the storefront still relies on `dev:https`, keep it rather than adopting the removal.

## Validation

1. `npm install -g portless`, then `pnpm dev:portless` from the storefront, then open `https://shop.localhost` — page loads over HTTPS with no port in the URL and no cross-origin dev-asset warnings in the terminal, and HMR reconnects on edit.
2. First run prompts once for `sudo` (bind 443) and once to trust the local CA (`portless trust`); subsequent runs are silent.
3. `pnpm --filter template lint` and a production `build` are unaffected.
