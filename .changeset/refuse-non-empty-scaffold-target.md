---
'create-vercel-shop': minor
---

Refuse to scaffold the template into a directory that already contains files. Previously the CLI created the target with `mkdir({ recursive: true })` and copied the template straight in, so pointing it at an existing project silently overwrote same-named files before `install` and `git init` ran. The CLI now inspects the target first: an empty or missing directory proceeds as before, a non-empty one asks for confirmation on a TTY (defaulting to no) and exits with code 1 in non-interactive environments such as CI or a coding agent. Pass the new `--force` flag to scaffold into a non-empty directory anyway. `--no-template` is unaffected — adding agent assets to an existing project is its purpose. A target path that exists but is not a directory now reports a clear error instead of crashing.
