---
title: Component/lib stutter folders — promote entries to index.tsx (or rename)
changeKey: stutter-dirs-to-index
introducedOn: 2026-04-25
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/components/layout/footer/index.tsx
  - apps/template/components/layout/action-bar/index.tsx
  - apps/template/components/agent/agent-panel.tsx
  - apps/template/components/agent/client.tsx
  - apps/template/lib/agent/create-agent.ts
  - apps/template/app/layout.tsx
  - apps/template/app/api/chat/route.ts
---

## Summary

Audit follow-up #4. Three folders had a "stutter" entry — the file was named the same as the folder, so importers read `@/components/layout/footer/footer`, `@/components/layout/action-bar/action-bar`, etc. The rest of the codebase doesn't do this — `components/layout/nav/index.tsx` is the comparable pattern, and `lib/cart/`, `lib/collections/`, `lib/markdown/` use descriptive filenames per file.

Two cases, handled differently based on whether the file is the folder's *entry* or just one internal module:

1. **Folder entry → `index.tsx`** (matches `components/layout/nav/index.tsx`):
   - `components/layout/footer/footer.tsx` → `components/layout/footer/index.tsx`
   - `components/layout/action-bar/action-bar.tsx` → `components/layout/action-bar/index.tsx`
   - `app/layout.tsx` importers updated: `@/components/layout/footer/footer` → `@/components/layout/footer`, same for action-bar.

2. **Not the entry → descriptive name** (matches `lib/`'s flat-by-purpose convention):
   - `components/agent/agent.tsx` → `components/agent/agent-panel.tsx`. The agent folder's user-facing entry is `agent-button.tsx`; `agent.tsx` was the heavy panel that gets dynamic-imported via `client.tsx`. Renaming to `agent-panel.tsx` matches what it actually exports (`AgentPanel`). `client.tsx`'s `import("./agent")` updated to `import("./agent-panel")`.
   - `lib/agent/agent.ts` → `lib/agent/create-agent.ts`. Single export `createAgent`; descriptive filename matches `lib/cart/action.ts`, `lib/markdown/catalog.ts`, etc. Importer in `app/api/chat/route.ts` updated.

No behavior changes. No public API changes (every export keeps its name).

## Why it matters

- Import paths read more naturally: `@/components/layout/footer` instead of `@/components/layout/footer/footer`.
- One stutter pattern less for an agent reading a new folder to interpret.
- Brings these folders in line with the patterns the rest of the repo already uses (`nav/index.tsx`; descriptive filenames in `lib/`).

## Apply when

- The storefront still uses the affected files largely as shipped and imports them at the listed paths.

## Safe to skip when

- The storefront has already moved or restructured these components.

## Validation

1. `pnpm --filter template build` — clean (the pre-existing i18n typecheck errors on main are unrelated).
2. `git grep -E "agent/agent\\b|footer/footer|action-bar/action-bar" apps/template` returns no results outside this rollout entry, the deliberate `agent-button` filename, and possibly transitive matches in node_modules.
3. Visit `/`, the cart overlay, and any page — Footer renders, ActionBar renders. Open the agent panel — `AgentPanel` still dynamic-loads.
4. POST to `/api/chat` — chat agent still works (verifies the `lib/agent/create-agent` rename).
