import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RichTextPage, RichTextPageSkeleton } from "@/components/content/rich-text-page";
import { getShopPolicies, getShopPolicy } from "@/lib/policies/server";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

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
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) return {};
  const policy = await getShopPolicy({
    handle,
  });
  if (!policy) notFound();
  const pathname = `/policies/${policy.handle}`;
  return {
    alternates: buildAlternates({ pathname }),
    openGraph: buildOpenGraph({ title: policy.title, type: "website", url: pathname }),
    title: policy.title,
  };
}

export default function PolicyPage({ params }: PageProps<"/policies/[handle]">) {
  return (
    <Suspense fallback={<RichTextPageSkeleton />}>
      <PolicyPageContent params={params} />
    </Suspense>
  );
}

async function PolicyPageContent({ params }: Pick<PageProps<"/policies/[handle]">, "params">) {
  const { handle } = await params;
  if (handle === PLACEHOLDER_HANDLE) notFound();
  const policy = await getShopPolicy({
    handle,
  });
  if (!policy) notFound();
  return <RichTextPage body={policy.body} title={policy.title} />;
}
