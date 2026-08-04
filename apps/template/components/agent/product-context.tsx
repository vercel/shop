"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { AgentProduct, AgentProductDetails } from "@/lib/agent/products";

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

function collectProducts(parts: UIMessage["parts"]): ProductMap {
  const products: ProductMap = new Map();

  for (const part of parts) {
    if (!isToolUIPart(part) || part.state !== "output-available") continue;
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
  parts: UIMessage["parts"];
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
