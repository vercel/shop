---
"create-vercel-shop": minor
---

Write a pnpm-workspace.yaml into scaffolded projects, carrying the monorepo's supply-chain policies (minimumReleaseAge and its excludes) and allowBuilds while dropping the monorepo-only packages list. Written before dependency installation so pnpm installs run under the same policy.
