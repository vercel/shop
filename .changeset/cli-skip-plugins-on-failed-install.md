---
'create-vercel-shop': patch
---

Skip plugin installs when the scaffold step did not produce a `node_modules` directory. `create-next-app` can exit 0 even when its `npm install` fails (notably on peer-dep conflicts), which previously left the CLI charging ahead with plugin installs against a half-scaffolded project. The CLI now treats a missing `node_modules` as a scaffold failure and prints retry instructions instead.
