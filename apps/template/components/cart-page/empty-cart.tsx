import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function Empty() {
  const t = await getTranslations("cart");

  return (
    <div className="flex flex-col items-center justify-center py-10 lg:py-10 px-5">
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tighter mb-6">{t("empty")}</h2>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        {t("continueShopping")}
      </Link>
    </div>
  );
}
