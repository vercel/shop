import { defaultLocale, resolveLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/translator";
import { homeToMarkdown } from "@/lib/markdown/home";
import { markdownHeaders } from "@/lib/markdown/representation";
import { getSearchIndexProducts } from "@/lib/product/server";

export async function GET(request: Request): Promise<Response> {
  const locale = resolveLocale(new URL(request.url).searchParams.get("locale") || defaultLocale);

  try {
    const [result, t] = await Promise.all([
      getSearchIndexProducts({ limit: 8, locale }),
      getTranslator(locale, "home"),
    ]);

    return new Response(
      homeToMarkdown({
        description: `${t("headline")}.`,
        locale,
        products: result.products,
      }),
      {
        headers: markdownHeaders({
          cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
          pathname: "/",
        }),
      },
    );
  } catch {
    return new Response(
      "# Server Error\n\nThe storefront could not be retrieved. Try again later.",
      {
        status: 500,
        headers: markdownHeaders({
          cacheControl: "no-cache, no-store, must-revalidate",
          pathname: "/",
        }),
      },
    );
  }
}
