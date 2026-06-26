---
title: Make Shopify AI Toolkit authoritative for Shopify API facts
changeKey: shopify-toolkit-integration-boundary
introducedOn: 2026-06-26
changeType: meta
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/AGENTS.md
relatedSkills:
  - /vercel-shop:architect-storefront
  - /vercel-shop:shopify-graphql-reference
---

## Summary

Define a strict plugin boundary: Shopify AI Toolkit owns current Shopify documentation, schemas, operation design, and validation; Vercel Shop owns how validated operations fit the template's files, domain types, cache role, locale flow, invalidation, and route architecture.

The redundant `fetch-shopify-schema` skill is removed. `shopify-graphql-reference` becomes a thin integration adapter instead of a second Shopify API reference.

## Why it matters

Duplicating Shopify schema knowledge creates drift, while a blanket cache recipe can break the template's static-shell coherence. Agents now validate Shopify facts with Shopify's tooling and make cache decisions from the operation's role in the Next.js render graph.

## Apply when

- Adopt when Shopify AI Toolkit is installed with a Vercel Shop project.
- Adopt when local agent guidance currently treats Vercel Shop skills as a Shopify schema source.

## Safe to skip when

- Skip only when equivalent guidance already delegates Shopify API facts and validation to authoritative Shopify tooling while preserving project-specific integration rules.

## Validation

1. Ask an agent to add a Storefront field and confirm it invokes Shopify AI Toolkit before editing GraphQL.
2. Confirm the agent uses Vercel Shop guidance afterward for operation placement, transforms, cache role, tags, and route composition.
3. Confirm no guidance applies `"use cache: remote"` indiscriminately to all public reads.
