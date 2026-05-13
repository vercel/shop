# create-vercel-shop

## 0.3.0

### Minor Changes

- [#273](https://github.com/vercel/shop/pull/273) [`cdecd0a`](https://github.com/vercel/shop/commit/cdecd0aafd5ee0c5d828f877f02a62363258d246) Thanks [@blurrah](https://github.com/blurrah)! - Replace the `create-next-app` delegation with a direct codeload tarball fetch of `apps/template`, plus a `<pm> install` and `git init`. Drops the flag-forwarding and pre-prompt ceremony that existed only to round-trip the project name through a subprocess. CLI surface is now `create-vercel-shop [name] [--no-template] [--use-pnpm|--use-npm|--use-yarn|--use-bun]`; create-next-app passthroughs like `--import-alias` are removed (the template's tsconfig already configures aliases).

### Patch Changes

- [`2b0eb6f`](https://github.com/vercel/shop/commit/2b0eb6fb5b73bf3e4ace74e9c9083c0e5071311c) Thanks [@blurrah](https://github.com/blurrah)! - Prompt for the project name up front when none is passed, so plugin installs run in the right directory. Previously, omitting the project-name argument let `create-next-app` prompt interactively in its own subprocess; the CLI never learned the chosen name and tried to install plugins in the parent directory. Also reverts the `node_modules` post-scaffold check, which was checking the wrong path in the same scenario.

## 0.2.2

### Patch Changes

- [`4d999fa`](https://github.com/vercel/shop/commit/4d999faf0214198fd6cf0ff809fb41951c160576) Thanks [@blurrah](https://github.com/blurrah)! - Skip plugin installs when the scaffold step did not produce a `node_modules` directory. `create-next-app` can exit 0 even when its `npm install` fails (notably on peer-dep conflicts), which previously left the CLI charging ahead with plugin installs against a half-scaffolded project. The CLI now treats a missing `node_modules` as a scaffold failure and prints retry instructions instead.

## 0.2.1

### Patch Changes

- [`32ad963`](https://github.com/vercel/shop/commit/32ad96362b25eb8ff8b20b604b5bcd5c5c348851) Thanks [@blurrah](https://github.com/blurrah)! - Fix symlinks for cli
