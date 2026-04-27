---
'create-vercel-shop': patch
---

Prompt for the project name up front when none is passed, so plugin installs run in the right directory. Previously, omitting the project-name argument let `create-next-app` prompt interactively in its own subprocess; the CLI never learned the chosen name and tried to install plugins in the parent directory. Also reverts the `node_modules` post-scaffold check, which was checking the wrong path in the same scenario.
