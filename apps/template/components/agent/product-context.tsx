"use client";

import type { EveMessage } from "eve/react";
import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products/types";

type ProductMap = Map<string, AgentProduct | AgentProductDetails>;

const AgentProductContext = createContext<ProductMap>(new Map());

function isAgentProduct(value: unknown): value is AgentProduct {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AgentProduct).handle === "string" &&
    typeof (value as AgentProduct).title === "string"
  );
}

function collectProducts(parts: EveMessage["parts"]): ProductMap {
  const products: ProductMap = new Map();

  for (const part of parts) {
    if (part.type !== "dynamic-tool" || part.state !== "output-available" || part.partial) continue;
    const output = part.output as { product?: unknown; products?: unknown } | undefined;
    if (!output) continue;

    const candidates = [
      ...(Array.isArray(output.products) ? output.products : []),
      ...(output.product ? [output.product] : []),
    ];
    for (const candidate of candidates) {
      // Details arrive after cards, so a later richer entry must win.
      if (isAgentProduct(candidate)) products.set(candidate.handle, candidate);
    }
  }

  return products;
}

export function AgentProductProvider({
  children,
  parts,
}: {
  children: ReactNode;
  parts: EveMessage["parts"];
}) {
  const products = useMemo(() => collectProducts(parts), [parts]);
  return <AgentProductContext.Provider value={products}>{children}</AgentProductContext.Provider>;
}

export function useAgentProduct(handle: string): AgentProduct | AgentProductDetails | undefined {
  return useContext(AgentProductContext).get(handle);
}

export function useAgentProductDetails(handle: string): AgentProductDetails | undefined {
  const product = useAgentProduct(handle);
  return product && "variants" in product ? product : undefined;
}
