---
'create-vercel-shop': patch
---

Point the `.claude/skills/<name>` link at the right place on Windows. The link was created with a relative target (`../../.agents/skills/<name>`), but Node resolves a relative target for a junction against `process.cwd()` instead of the link's own directory — so scaffolding from anywhere other than the project's parent produced a junction aimed at a path that does not exist, without raising an error. The target is now resolved against the link's directory on Windows; POSIX symlinks stay relative so a scaffolded project remains movable.
