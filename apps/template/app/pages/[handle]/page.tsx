import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RichTextPage } from "@/components/content/rich-text-page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getPage } from "@/lib/shopify/operations/pages";
import { getShopifySitemapPage } from "@/lib/shopify/operations/sitemap";

const PLACEHOLDER_HANDLE = "__placeholder__";

export async function generateStaticParams() {
  try {
    const { items } = await getShopifySitemapPage("PAGE", 1);
    const first = items[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/pages/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) return {};

  const page = await getPage({ handle, locale });
  if (!page) notFound();

  const pathname = `/pages/${page.handle}`;
  return {
    alternates: buildAlternates({ pathname }),
    description: page.seo.description,
    openGraph: buildOpenGraph({
      description: page.seo.description,
      title: page.seo.title,
      type: "website",
      url: pathname,
    }),
    title: page.seo.title,
  };
}

export default async function ShopifyPage({ params }: PageProps<"/pages/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const page = await getPage({ handle, locale });
  if (!page) notFound();

  return <RichTextPage body={page.body} title={page.title} />;
}
