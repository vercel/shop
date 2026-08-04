"use client";

import { useTranslations } from "next-intl";

export function AgentThinking({ active, tool }: { active: boolean; tool?: string }) {
  const t = useTranslations("agent");
  if (!active) return null;

  const toolLabels: Record<string, string> = {
    addCartNote: t("toolAddCartNote"),
    addToCart: t("toolAddToCart"),
    browseCollection: t("toolBrowseCollection"),
    getCart: t("toolGetCart"),
    getProductDetails: t("toolGetProductDetails"),
    getProductRecommendations: t("toolGetRecommendations"),
    listCollections: t("toolListCollections"),
    navigateUser: t("toolNavigate"),
    searchProducts: t("toolSearchProducts"),
    searchShopPolicies: t("toolSearchPolicies"),
    updateCartItem: t("toolUpdateCart"),
  };

  return (
    <p className="shimmer w-fit text-muted-foreground text-sm">
      {(tool ? toolLabels[tool] : undefined) ?? t("thinking")}
    </p>
  );
}
