import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RichTextPage } from "@/components/content/rich-text-page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getShopPolicies, getShopPolicy } from "@/lib/shopify/operations/policies";

const PLACEHOLDER_HANDLE = "__placeholder__";

export async function generateStaticParams() {
  try {
    const policies = await getShopPolicies();
    return policies.length > 0
      ? policies.map(({ handle }) => ({ handle }))
      : [{ handle: PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/policies/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) return {};

  const policy = await getShopPolicy({ handle, locale });
  if (!policy) notFound();

  const pathname = `/policies/${policy.handle}`;
  return {
    alternates: buildAlternates({ pathname }),
    openGraph: buildOpenGraph({ title: policy.title, type: "website", url: pathname }),
    title: policy.title,
  };
}

export default async function PolicyPage({ params }: PageProps<"/policies/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const policy = await getShopPolicy({ handle, locale });
  if (!policy) notFound();

  return <RichTextPage body={policy.body} title={policy.title} />;
}
