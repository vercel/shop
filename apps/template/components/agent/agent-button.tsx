import type { Locale } from "@/lib/i18n";
import { tNamespace } from "@/lib/i18n/server";
import { getLocale } from "@/lib/params";

import { AgentButtonClient } from "./agent-button-client";

export async function AgentButton() {
  const [locale, agentLabels, cartLabels, productLabels] = await Promise.all([
    getLocale(),
    tNamespace("agent"),
    tNamespace("cart"),
    tNamespace("product"),
  ]);

  return (
    <AgentButtonClient
      agentLabels={agentLabels}
      cartLabels={cartLabels}
      locale={locale satisfies Locale}
      productLabels={productLabels}
    />
  );
}
