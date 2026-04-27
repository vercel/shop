# create-vercel-shop

## 0.2.2

### Patch Changes

- [`4d999fa`](https://github.com/vercel/shop/commit/4d999faf0214198fd6cf0ff809fb41951c160576) Thanks [@blurrah](https://github.com/blurrah)! - Skip plugin installs when the scaffold step did not produce a `node_modules` directory. `create-next-app` can exit 0 even when its `npm install` fails (notably on peer-dep conflicts), which previously left the CLI charging ahead with plugin installs against a half-scaffolded project. The CLI now treats a missing `node_modules` as a scaffold failure and prints retry instructions instead.

## 0.2.1

### Patch Changes

- [`32ad963`](https://github.com/vercel/shop/commit/32ad96362b25eb8ff8b20b604b5bcd5c5c348851) Thanks [@blurrah](https://github.com/blurrah)! - Fix symlinks for cli
