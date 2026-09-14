"use client";

import { useTranslations } from "next-intl";

export function AgentThinking({ active, tool }: { active: boolean; tool?: string }) {
  const t = useTranslations("agent");
  if (!active) return null;
  const toolLabels: Record<string, string> = {
    "add-cart-note": t("toolAddCartNote"),
    "add-to-cart": t("toolAddToCart"),
    "browse-collection": t("toolBrowseCollection"),
    "get-cart": t("toolGetCart"),
    "get-product-details": t("toolGetProductDetails"),
    "get-recommendations": t("toolGetRecommendations"),
    "list-collections": t("toolListCollections"),
    navigate: t("toolNavigate"),
    "present-products": t("toolPresentProducts"),
    policies__search_shop_policies_and_faqs: t("toolSearchPolicies"),
    shopify__search_catalog: t("toolSearchProducts"),
    "update-cart-item": t("toolUpdateCart"),
  };
  return (
    <p className="shimmer w-fit text-muted-foreground text-sm">
      {(tool ? toolLabels[tool] : undefined) ?? t("thinking")}
    </p>
  );
}
