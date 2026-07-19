---
title: Example changelog entry
changeKey: example-changelog-entry
introducedOn: 2026-07-19
pr: 0
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/docs/content/changelog/_template.md
relatedSkills: []
---

## Summary

This is a placeholder entry that documents the changelog format and powers the
changelog page until real entries land. Copy this file when adding a new entry;
do not list this file in any release.

## Why it matters

Keeps the changelog page populated during the cutover so the route and rendering
pipeline are exercised before the first real entry arrives.

## Apply when

- Never. This is a template, not an upgrade.

## Safe to skip when

- Always. Ignore this entry when building the upgrade candidate list.

## Validation

1. Confirm the changelog page renders this entry.
2. Confirm the `update-shop` skill skips it (it carries no real change).
