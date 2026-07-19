# Vercel Shop Monorepo

This is a monorepo for developing a template, docs site, and skills for using Next.js with Shopify and deploying to Vercel.

## Docs

The docs app is in apps/docs using the package-based Geistdocs architecture ([`@vercel/geistdocs`](https://www.npmjs.com/package/@vercel/geistdocs)). See apps/docs/AGENTS.md for editing conventions.

## Template

* The main app in this monorepo is apps/template, which is a template/reference architecture for using Shopify and Next.js. Learn more by reading the AGENTS.md in the directory.
* You MUST check if a feature being updated in the template is documented in the docs application. If so, also update the documentation.
* When a pull request is opened that touches `apps/template`, before other work, run a quick changelog-worthiness check. Add a changelog entry only if the change affects downstream storefronts: user-visible behavior, routes, config or environment variables, caching or cache invalidation, data contracts (GraphQL operations/types), dependencies that change runtime behavior, or breaking changes. Skip the entry for pure docs, tests, chore, tooling, or refactors with no behavior change. When in doubt, add an entry. To add one, create `apps/docs/content/changelog/<slug>.md` with frontmatter (`title`, `changeKey`, `introducedOn` as the PR's merge date, `pr`, `changeType`, `defaultAction`, `appliesTo`, `paths`, optional `relatedSkills`) and the Summary / Why it matters / Apply when / Safe to skip when / Validation sections. Land the entry in the same PR as the code change so the timestamp matches merge time. Entries aggregate on the changelog page; do not cut a release per PR. This rule is advisory — there is no CI enforcement.

## Skills

Skills to be used by the template and docs are written to `packages/plugin/skills`.
When a skill in that directory gets updated, you MUST ask if that skill should be updated in the docs as well via the docs skill sync script.
