import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RichTextPage, RichTextPageSkeleton } from "@/components/content/rich-text-page";
import { getPage } from "@/lib/pages/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getShopifySitemapPage } from "@/lib/seo/server";

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
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) return {};
  const page = await getPage({
    handle,
  });
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

export default function ShopifyPage({ params }: PageProps<"/pages/[handle]">) {
  return (
    <Suspense fallback={<RichTextPageSkeleton />}>
      <ShopifyPageContent params={params} />
    </Suspense>
  );
}

async function ShopifyPageContent({ params }: Pick<PageProps<"/pages/[handle]">, "params">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  const page = await getPage({
    handle,
  });
  if (!page) notFound();
  return <RichTextPage body={page.body} title={page.title} />;
}
