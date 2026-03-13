import { getTranslations } from "next-intl/server";

export async function FeaturedBadge() {
  const t = await getTranslations("product");
  return (
    <span className="inline-flex self-start items-center pl-2 pr-5 py-0.5 bg-primary rounded-tl-lg not-supports-[clip-path:shape(from_0_0)]:rounded-tr-lg clip-featured-badge text-xs text-primary-foreground font-medium">
      {t("featuredBadge")}
    </span>
  );
}
