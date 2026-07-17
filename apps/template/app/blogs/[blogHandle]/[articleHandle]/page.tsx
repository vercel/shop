import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlePage } from "@/components/blog/article-page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getBlog, getBlogArticle } from "@/lib/shopify/operations/blogs";
import { getShopifySitemapPage } from "@/lib/shopify/operations/sitemap";

const PLACEHOLDER_HANDLE = "__placeholder__";

export async function generateStaticParams() {
  try {
    const { items } = await getShopifySitemapPage("BLOG", 1);
    const firstBlog = items[0];
    if (!firstBlog) {
      return [{ blogHandle: PLACEHOLDER_HANDLE, articleHandle: PLACEHOLDER_HANDLE }];
    }

    const blog = await getBlog({ handle: firstBlog.handle, limit: 1 });
    const firstArticle = blog?.articles[0];
    return [
      firstArticle
        ? { blogHandle: blog.handle, articleHandle: firstArticle.handle }
        : { blogHandle: PLACEHOLDER_HANDLE, articleHandle: PLACEHOLDER_HANDLE },
    ];
  } catch {
    return [{ blogHandle: PLACEHOLDER_HANDLE, articleHandle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/blogs/[blogHandle]/[articleHandle]">): Promise<Metadata> {
  const [{ blogHandle, articleHandle }, locale] = await Promise.all([params, getLocale()]);
  if (blogHandle === PLACEHOLDER_HANDLE || articleHandle === PLACEHOLDER_HANDLE) return {};

  const article = await getBlogArticle({ articleHandle, blogHandle, locale });
  if (!article) notFound();

  const pathname = `/blogs/${article.blogHandle}/${article.handle}`;
  const images = article.image
    ? [
        {
          alt: article.image.altText,
          height: article.image.height,
          url: article.image.url,
          width: article.image.width,
        },
      ]
    : ["/og-default.png"];

  return {
    alternates: buildAlternates({ pathname }),
    description: article.seo.description,
    openGraph: buildOpenGraph({
      description: article.seo.description,
      images,
      title: article.seo.title,
      type: "article",
      url: pathname,
    }),
    title: article.seo.title,
    twitter: {
      card: "summary_large_image",
      description: article.seo.description,
      images,
      title: article.seo.title,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: PageProps<"/blogs/[blogHandle]/[articleHandle]">) {
  const [{ blogHandle, articleHandle }, locale] = await Promise.all([params, getLocale()]);
  if (blogHandle === PLACEHOLDER_HANDLE || articleHandle === PLACEHOLDER_HANDLE) notFound();

  const article = await getBlogArticle({ articleHandle, blogHandle, locale });
  if (!article) notFound();

  return <ArticlePage article={article} locale={locale} />;
}
