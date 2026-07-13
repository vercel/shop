import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/blog/article-card";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getBlog } from "@/lib/shopify/operations/blogs";
import { getShopifySitemapPage } from "@/lib/shopify/operations/sitemap";

const PLACEHOLDER_HANDLE = "__placeholder__";

export async function generateStaticParams() {
  try {
    const { items } = await getShopifySitemapPage("BLOG", 1);
    const first = items[0];
    return [{ blogHandle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ blogHandle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blogs/[blogHandle]">): Promise<Metadata> {
  const [{ blogHandle }, locale] = await Promise.all([params, getLocale()]);
  if (blogHandle === PLACEHOLDER_HANDLE) return {};

  const blog = await getBlog({ handle: blogHandle, locale });
  if (!blog) notFound();

  const pathname = `/blogs/${blog.handle}`;
  return {
    alternates: buildAlternates({ pathname }),
    description: blog.seo.description,
    openGraph: buildOpenGraph({
      description: blog.seo.description,
      title: blog.seo.title,
      type: "website",
      url: pathname,
    }),
    title: blog.seo.title,
  };
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blogs/[blogHandle]">) {
  const [{ blogHandle }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("blog"),
  ]);
  if (blogHandle === PLACEHOLDER_HANDLE) notFound();

  const blog = await getBlog({ handle: blogHandle, locale });
  if (!blog) notFound();

  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl">{blog.title}</h1>
          {blog.articles.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {blog.articles.map((article) => (
                <ArticleCard article={article} key={article.handle} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("empty")}</p>
          )}
        </Sections>
      </Container>
    </Page>
  );
}
