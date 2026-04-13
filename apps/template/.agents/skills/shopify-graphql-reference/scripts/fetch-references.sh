#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_ROOT="$(cd "${SKILL_DIR}/../../.." && pwd)"
SCHEMA_DIR="${TEMPLATE_ROOT}/.claude/schemas"
DEST_DIR="${SKILL_DIR}/references/schemas"

required_files=(
  "${SCHEMA_DIR}/shopify-storefront.graphql"
  "${SCHEMA_DIR}/shopify-customer.graphql"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "${file}" ]]; then
    echo "Missing required schema snapshot: ${file}" >&2
    echo "Run bun run .claude/scripts/fetch-shopify-schemas.ts from apps/template first." >&2
    exit 1
  fi
done

mkdir -p "${DEST_DIR}"

cp "${SCHEMA_DIR}/shopify-storefront.graphql" "${DEST_DIR}/shopify-storefront.graphql"
cp "${SCHEMA_DIR}/shopify-customer.graphql" "${DEST_DIR}/shopify-customer.graphql"

echo "Bundled Shopify schema references updated in ${DEST_DIR}"
