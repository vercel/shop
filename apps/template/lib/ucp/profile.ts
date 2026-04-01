/**
 * UCP Discovery Profile Generator
 *
 * Generates the /.well-known/ucp profile based on config.
 */

import type { UCPDiscoveryProfile } from "./types";

const UCP_VERSION = "2026-01-11";

export function generateProfile(baseUrl: string): UCPDiscoveryProfile {
  return {
    ucp: {
      version: UCP_VERSION,
      services: {
        "dev.ucp.shopping": {
          version: UCP_VERSION,
          spec: "https://ucp.dev/spec/services/shopping",
          rest: {
            schema: "https://ucp.dev/spec/services/shopping/rest.openapi.json",
            endpoint: `${baseUrl}/api/ucp`,
          },
          mcp: {
            schema: "https://ucp.dev/spec/services/shopping/mcp.openrpc.json",
            endpoint: `${baseUrl}/api/mcp`,
          },
        },
      },
      capabilities: [
        {
          name: "dev.ucp.shopping.checkout",
          version: UCP_VERSION,
          spec: "https://ucp.dev/spec/capabilities/checkout",
          schema: "https://ucp.dev/spec/schemas/shopping/checkout.json",
        },
        {
          name: "dev.ucp.shopping.catalog_search",
          version: UCP_VERSION,
          spec: "https://ucp.dev/spec/capabilities/catalog-search",
          schema: "https://ucp.dev/spec/schemas/shopping/catalog_search.json",
        },
        {
          name: "dev.ucp.shopping.catalog_lookup",
          version: UCP_VERSION,
          spec: "https://ucp.dev/spec/capabilities/catalog-lookup",
          schema: "https://ucp.dev/spec/schemas/shopping/catalog_lookup.json",
        },
      ],
    },
  };
}
