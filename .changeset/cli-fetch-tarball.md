---
'create-vercel-shop': minor
---

Replace the `create-next-app` delegation with a `degit` pull of `apps/template`, plus a `<pm> install` and `git init`. Drops the flag-forwarding and pre-prompt ceremony that existed only to round-trip the project name through a subprocess. CLI surface is now `create-vercel-shop [name] [--no-template] [--use-pnpm|--use-npm|--use-yarn|--use-bun]`; create-next-app passthroughs like `--import-alias` are removed (the template's tsconfig already configures aliases).
