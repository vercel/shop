"use client";

import { useTranslations } from "next-intl";

export function AgentThinking({ active }: { active: boolean }) {
  const t = useTranslations("agent");
  if (!active) return null;
  return <p className="shimmer w-fit text-muted-foreground text-sm">{t("thinking")}</p>;
}
