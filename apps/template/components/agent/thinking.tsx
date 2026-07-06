"use client";

import { useTranslations } from "next-intl";

/** A minimal "Thinking…" indicator shown while the assistant works, before any
 *  text or card appears. No step-by-step chain-of-thought — it's noise for shoppers. */
export function AgentThinking({ active }: { active: boolean }) {
  const t = useTranslations("agent");
  if (!active) return null;
  return <p className="shimmer w-fit text-muted-foreground text-sm">{t("thinking")}</p>;
}
